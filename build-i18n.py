#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-i18n.py — gera as versões multi-idioma das páginas de marketing do OND.

Fonte única (NÃO edite a raiz à mão): i18n/src/{index,agencias,assessoria}.html
Traduções: i18n/strings.*.json  (keyed pela string pt exata -> {en,es,fr,it})

O que faz, por página e por idioma (pt na raiz; en/es/fr/it em subpasta):
  - Tokeniza a copy estática (head + body ATÉ o 1º <script>) e injeta a tradução.
    Os blocos <script> (widget/simulação do app) NÃO são tocados: seguem em pt.
  - Ajusta <html lang>, og:locale, canonical, og:url por idioma.
  - Injeta o seletor de idioma no header (nomes por extenso, sem localStorage).
  - Injeta <link rel="alternate" hreflang> (5 idiomas + x-default -> pt).
  - Torna assets/tokens/blog absolutos (funcionam de qualquer subpasta).
  - Regenera o sitemap.xml (marketing com alternates + preserva os posts do blog).

Rode:  python build-i18n.py
IMPORTANTE: rode DEPOIS do build-blog.py (ambos escrevem sitemap.xml).
"""
import os, re, json, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.join(ROOT, 'i18n', 'src')
SITE = 'https://ondviajar.com.br/'

# (code, <html lang>, og:locale, nome por extenso, sigla, hreflang)
LOCALES = [
    ('pt', 'pt-BR', 'pt_BR', 'Português', 'PT', 'pt-BR'),
    ('en', 'en',    'en_US', 'English',    'EN', 'en'),
    ('es', 'es',    'es_ES', 'Español',    'ES', 'es'),
    ('fr', 'fr',    'fr_FR', 'Français',   'FR', 'fr'),
    ('it', 'it',    'it_IT', 'Italiano',   'IT', 'it'),
]

# base -> arquivos de strings (common + específicos da página)
PAGES = {
    'index.html':      ['strings.common', 'strings.index', 'strings.index2'],
    'agencias.html':   ['strings.common', 'strings.agencias', 'strings.agencias2'],
    'assessoria.html': ['strings.common', 'strings.assessoria'],
}

PRIORITY = {'index.html': '1.0', 'agencias.html': '0.9', 'assessoria.html': '0.8'}
CHANGEFREQ = {'index.html': 'weekly', 'agencias.html': 'monthly', 'assessoria.html': 'monthly'}


def load_strings(files):
    d = {}
    for f in files:
        p = os.path.join(ROOT, 'i18n', f + '.json')
        with open(p, encoding='utf-8') as fh:
            d.update(json.load(fh))
    return d


def page_url(loc, base):
    d = '' if loc == 'pt' else loc + '/'
    return SITE + d if base == 'index.html' else SITE + d + base


def page_path(loc, base):
    d = '' if loc == 'pt' else loc + '/'
    return '/' + d if base == 'index.html' else '/' + d + base


GLOBE = ('<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" '
         'stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/>'
         '<path d="M3 12h18M12 3a14 14 0 0 1 4 9 14 14 0 0 1-4 9 14 14 0 0 1-4-9 14 14 0 0 1 4-9z"/></svg>')

LANGSEL_CSS = """
<style>
.langsel{position:relative;flex-shrink:0}
@media(max-width:960px){.langsel{display:none}.header-actions{flex:0 0 auto}}
.mobile-lang{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:18px 0 2px}
.mobile-lang>span{font-size:.85rem;color:var(--muted);margin-right:2px}
.mobile-nav .mobile-lang a{padding:5px 10px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;font-weight:700;color:var(--muted);border-bottom:1px solid var(--border)}
.mobile-nav .mobile-lang a[aria-current="true"]{color:var(--text);border-color:var(--text)}
.langsel>summary{list-style:none;display:flex;align-items:center;gap:6px;height:34px;padding:0 10px;
  border:1px solid var(--border);border-radius:17px;color:var(--muted);cursor:pointer;font-size:.82rem;
  font-weight:600;background:none;transition:border-color .2s,background .2s,color .2s}
.langsel>summary::-webkit-details-marker{display:none}
.langsel>summary:hover{border-color:var(--purple);background:var(--purple-dim);color:var(--text)}
.langsel-caret{font-size:.7rem;opacity:.7}
.langsel[open]>summary .langsel-caret{transform:rotate(180deg)}
.langsel-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:168px;list-style:none;margin:0;padding:6px;
  background:var(--surface);border:1px solid var(--border);border-radius:12px;
  box-shadow:0 12px 32px rgba(0,0,0,.28);z-index:250}
.langsel-menu li{list-style:none}
.langsel-menu a{display:block;padding:9px 12px;border-radius:8px;color:var(--text);text-decoration:none;
  font-size:.9rem;transition:background .15s}
.langsel-menu a:hover{background:var(--purple-dim)}
.langsel-menu a[aria-current="true"]{color:var(--purple-light);font-weight:700}
</style>
"""


def build_selector(cur_loc, base):
    items = []
    for code, htmllang, ogloc, name, short, hreflang in LOCALES:
        cur = ' aria-current="true"' if code == cur_loc else ''
        items.append(
            '    <li><a href="%s" hreflang="%s" lang="%s"%s>%s</a></li>'
            % (page_path(code, base), hreflang, htmllang, cur, name))
    cur_short = next(l[4] for l in LOCALES if l[0] == cur_loc)
    return (
        '<details class="langsel">\n'
        '  <summary class="langsel-btn" aria-label="Idioma / Language">%s'
        '<span class="langsel-cur">%s</span><span class="langsel-caret">▾</span></summary>\n'
        '  <ul class="langsel-menu">\n%s\n  </ul>\n</details>\n  '
        % (GLOBE, cur_short, '\n'.join(items)))


def build_mobile_lang(cur_loc, base):
    """Seletor de idioma dentro do menu hamburguer (mobile). Links -> versao
    equivalente da propria pagina em cada idioma; idioma atual marcado."""
    links = []
    for code, htmllang, ogloc, name, short, hreflang in LOCALES:
        cur = ' aria-current="true"' if code == cur_loc else ''
        links.append('<a href="%s"%s>%s</a>' % (page_path(code, base), cur, short))
    return '<div class="mobile-lang"><span>Idioma</span>%s</div>' % ''.join(links)


def build_hreflang(base):
    out = []
    for code, htmllang, ogloc, name, short, hreflang in LOCALES:
        out.append('<link rel="alternate" hreflang="%s" href="%s">' % (hreflang, page_url(code, base)))
    out.append('<link rel="alternate" hreflang="x-default" href="%s">' % page_url('pt', base))
    return '\n'.join(out) + '\n'


def absolutize(s):
    s = s.replace('href="assets/', 'href="/assets/').replace('src="assets/', 'src="/assets/')
    s = s.replace("href='assets/", "href='/assets/").replace("src='assets/", "src='/assets/")
    s = s.replace('href="tokens/', 'href="/tokens/').replace('src="tokens/', 'src="/tokens/')
    s = s.replace('href="blog.html"', 'href="/blog.html"')
    return s


def tokenize(region, strings):
    """Substitui cada string pt por um token @@i@@ (maior primeiro). Retorna (region, tokens)."""
    keys = sorted(strings.keys(), key=len, reverse=True)
    tokens = []
    missing = []
    for i, k in enumerate(keys):
        if k in region:
            tok = '@@%d@@' % i
            region = region.replace(k, tok)
            tokens.append((tok, k))
        else:
            missing.append(k)
    return region, tokens, missing


def render_page(base, strings):
    src_path = os.path.join(SRC, base)
    with open(src_path, encoding='utf-8') as fh:
        src = fh.read()

    # protege TODOS os blocos <script> (JSON-LD, widget/simulação, <script src>):
    # ficam intactos (pt) e fora da tokenização de copy.
    scripts = []
    def _stash(mo):
        scripts.append(mo.group(0))
        return '@@SCRIPT%d@@' % (len(scripts) - 1)
    work = re.sub(r'<script\b[^>]*>.*?</script>', _stash, src, flags=re.S)

    work_orig = work
    work, tokens, missing = tokenize(work, strings)
    absent = [k for k in missing if k not in work_orig]  # de verdade ausentes (erro real)
    if absent:
        print('  !! %d strings AUSENTES do fonte em %s (revisar a chave pt):' % (len(absent), base))
        for k in absent[:10]:
            print('      -', k[:70].encode('ascii', 'replace').decode())

    for code, htmllang, ogloc, name, short, hreflang in LOCALES:
        doc = work
        for tok, key in tokens:
            tr = strings[key].get(code) if code != 'pt' else key
            doc = doc.replace(tok, tr if tr else key)
        for i, sc in enumerate(scripts):
            doc = doc.replace('@@SCRIPT%d@@' % i, sc)

        # meta estrutural por idioma
        doc = doc.replace('<html lang="pt-BR"', '<html lang="%s"' % htmllang, 1)
        doc = doc.replace('<meta property="og:locale" content="pt_BR">',
                          '<meta property="og:locale" content="%s">' % ogloc, 1)
        doc = re.sub(r'<link rel="canonical" href="[^"]*">',
                     '<link rel="canonical" href="%s">' % page_url(code, base), doc, count=1)
        doc = re.sub(r'<meta property="og:url" content="[^"]*">',
                     '<meta property="og:url" content="%s">' % page_url(code, base), doc, count=1)

        # seletor de idioma antes do botao de tema
        doc = doc.replace('<button class="theme-btn"',
                          build_selector(code, base) + '<button class="theme-btn"', 1)
        # seletor de idioma dentro do menu hamburguer (mobile)
        doc = doc.replace('<!--@@MOBILE_LANG@@-->', build_mobile_lang(code, base), 1)
        # hreflang + css do seletor antes do </head>
        doc = doc.replace('</head>', LANGSEL_CSS + build_hreflang(base) + '</head>', 1)

        doc = absolutize(doc)

        dest_dir = ROOT if code == 'pt' else os.path.join(ROOT, code)
        os.makedirs(dest_dir, exist_ok=True)
        with open(os.path.join(dest_dir, base), 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(doc)
    print('  ok: %s -> raiz + %s' % (base, ', '.join(l[0] for l in LOCALES if l[0] != 'pt')))


def write_sitemap():
    """Marketing (5 idiomas, com alternates) + preserva os <url> do blog do sitemap atual."""
    today = datetime.date.today().isoformat()
    blog_blocks = []
    sp = os.path.join(ROOT, 'sitemap.xml')
    if os.path.exists(sp):
        with open(sp, encoding='utf-8') as fh:
            cur = fh.read()
        for block in re.findall(r'<url>.*?</url>', cur, re.S):
            if '/blog' in block:
                blog_blocks.append('  ' + block.strip())

    urls = []
    for base in ['index.html', 'agencias.html', 'assessoria.html']:
        alts = ''.join(
            '\n    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>' % (l[5], page_url(l[0], base))
            for l in LOCALES)
        alts += '\n    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>' % page_url('pt', base)
        for code, htmllang, ogloc, name, short, hreflang in LOCALES:
            pr = PRIORITY[base] if code == 'pt' else '0.7'
            urls.append(
                '  <url>\n    <loc>%s</loc>%s\n    <lastmod>%s</lastmod>\n'
                '    <changefreq>%s</changefreq>\n    <priority>%s</priority>\n  </url>'
                % (page_url(code, base), alts, today, CHANGEFREQ[base], pr))

    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + '\n'.join(urls + blog_blocks) + '\n</urlset>\n')
    with open(sp, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(xml)
    print('sitemap.xml: %d urls de marketing + %d do blog' % (len(urls), len(blog_blocks)))


def main():
    print('build-i18n: gerando paginas por idioma...')
    for base, files in PAGES.items():
        render_page(base, load_strings(files))
    write_sitemap()
    print('pronto.')


if __name__ == '__main__':
    main()
