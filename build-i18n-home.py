#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-i18n-home.py: gera en/, es/, fr/, it/ index.html a partir da home em pt (index.html da raiz).

Troca só texto visível e atributos (alt, aria-label, placeholder, title, content) por
correspondência exata, usando i18n/home-traducoes.json (texto pt -> {en, es, fr, it}).
Não toca em <script> nem <style>. Ajusta lang, og:locale, canonical, og:url e o seletor de idioma.

Rode depois de mudar a home:  python build-i18n-home.py
Texto novo sem tradução aparece listado no final (fica em pt até ser traduzido).
"""
import os, re, json

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://ondviajar.com.br/'
LOC = {'en': ('en', 'en_US', 'EN', 'Language'), 'es': ('es', 'es_ES', 'ES', 'Idioma'),
       'fr': ('fr', 'fr_FR', 'FR', 'Langue'), 'it': ('it', 'it_IT', 'IT', 'Lingua')}
ATTR = re.compile(r'\b(alt|aria-label|placeholder|title|content)="([^"]*)"')


def carrega():
    with open(os.path.join(ROOT, 'i18n', 'home-traducoes.json'), encoding='utf-8') as fh:
        return json.load(fh)


def traduz(doc, tr, lang, faltando):
    partes = re.split(r'(<[^>]+>)', doc)
    dentro = None  # 'script' | 'style' | None
    for i, p in enumerate(partes):
        if p.startswith('<'):
            low = p[:8].lower()
            if dentro:
                if low.startswith('</' + dentro): dentro = None
                continue
            if low.startswith('<script') and not p.endswith('/>'): dentro = 'script'
            elif low.startswith('<style'): dentro = 'style'
            partes[i] = ATTR.sub(lambda m: '%s="%s"' % (m.group(1), tr[m.group(2)][lang]) if m.group(2) in tr else m.group(0), p)
        elif not dentro:
            t = p.strip()
            if not t: continue
            if t in tr:
                partes[i] = p.replace(t, tr[t][lang], 1)
            elif re.search(r'[A-Za-zÀ-ú]{3,}', t):
                faltando.add(t)
    return ''.join(partes)


def absolutiza(s):
    for a, b in (('href="assets/', 'href="/assets/'), ('src="assets/', 'src="/assets/'),
                 ('href="tokens/', 'href="/tokens/'), ('href="blog.html"', 'href="/blog.html"'),
                 ('href="index.html"', 'href="/"')):
        s = s.replace(a, b)
    return s


def main():
    tr = carrega()
    wa = tr.pop('__whatsapp__', {})
    with open(os.path.join(ROOT, 'index.html'), encoding='utf-8') as fh:
        pt = fh.read().replace('\r\n', '\n')
    faltando = set()
    for code, (htmllang, ogloc, short, rotulo) in LOC.items():
        doc = traduz(pt, tr, code, faltando)
        for k, v in wa.items():
            doc = doc.replace(k, v[code])
        url = SITE + code + '/'
        doc = doc.replace('<html lang="pt-BR"', '<html lang="%s"' % htmllang, 1)
        doc = doc.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="%s">' % ogloc, 1)
        doc = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % url, doc, count=1)
        doc = re.sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % url, doc, count=1)
        # seletor de idioma: marca o idioma atual
        doc = doc.replace('lang="pt-BR" aria-current="true">', 'lang="pt-BR">', 1)
        doc = doc.replace('hreflang="%s" lang="%s">' % (code, htmllang), 'hreflang="%s" lang="%s" aria-current="true">' % (code, htmllang), 1)
        doc = doc.replace('<span class="langsel-cur">PT</span>', '<span class="langsel-cur">%s</span>' % short, 1)
        doc = doc.replace('<div class="mobile-lang"><span>Idioma</span><a href="/" aria-current="true">PT</a>',
                          '<div class="mobile-lang"><span>%s</span><a href="/">PT</a>' % rotulo, 1)
        doc = doc.replace('<a href="/%s/">%s</a>' % (code, short), '<a href="/%s/" aria-current="true">%s</a>' % (code, short), 1)
        doc = absolutiza(doc)
        os.makedirs(os.path.join(ROOT, code), exist_ok=True)
        with open(os.path.join(ROOT, code, 'index.html'), 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(doc)
        print('ok', code)
    if faltando:
        print('\nsem tradução (ficou em pt):')
        for t in sorted(faltando): print('  -', t[:90])


if __name__ == '__main__':
    main()
