#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-destinos.py: monta o catálogo de destinos e a página de cada destino nos cinco idiomas do site.

Fonte única: a vitrine de destinos do backend (GET /api/showcase/destinations?locale=), que traz a
cidade, o país, as ocasiões, os meses, os dias e os textos de cada destino no idioma pedido.
Textos de interface em i18n/vitrine-textos.json; o resto da página do catálogo é traduzido com
i18n/home-traducoes.json mais i18n/viagens-traducoes.json, por correspondência exata, como a home.

Saída:
  viagens/index.html                  só o trecho entre <!-- vitrine:inicio --> e <!-- vitrine:fim -->
  en|es|fr|it/viagens/index.html      o catálogo inteiro no idioma
  viagens/<slug>/, <idioma>/viagens/<slug>/   uma página por destino

As fichas saem agrupadas pelo país padrão do idioma (pt Brasil, en Estados Unidos, es Espanha,
fr França, it Itália). No navegador, o script do catálogo reagrupa pelo país de quem visita.

Rode depois de mexer na vitrine:  python build-destinos.py
Contra outro backend:            python build-destinos.py --api https://dev.agamatec.com
"""
import os, re, sys, json, html, importlib.util, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://ondviajar.com.br'
WA_VENDA = '5511910214133'
WA_PAGINA = '5511943615412'
API_PADRAO = 'https://ond.agamatec.com'

IDIOMAS = {
    'pt': {'html': 'pt-BR', 'og': 'pt_BR', 'pasta': '', 'pais': 'BR'},
    'en': {'html': 'en', 'og': 'en_US', 'pasta': 'en/', 'pais': 'US'},
    'es': {'html': 'es', 'og': 'es_ES', 'pasta': 'es/', 'pais': 'ES'},
    'fr': {'html': 'fr', 'og': 'fr_FR', 'pasta': 'fr/', 'pais': 'FR'},
    'it': {'html': 'it', 'og': 'it_IT', 'pasta': 'it/', 'pais': 'IT'},
}
OCASIAO = {'HONEYMOON': 'lua-de-mel', 'FAMILY': 'familia', 'FRIENDS': 'amigos', 'NATURE': 'natureza',
           'SNOW': 'neve', 'FIRST_INTERNATIONAL': 'primeira', 'CITY_CULTURE': 'cidade'}
DURACAO = {'SHORT': 'curta', 'MEDIUM': 'media', 'LONG': 'longa'}
MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
INICIO, FIM = '<!-- vitrine:inicio -->\n', '<!-- vitrine:fim -->\n'


def ler(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as fh:
        return fh.read().replace('\r\n', '\n')


def grava(p, conteudo):
    destino = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(conteudo)


def limpa(t):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t)).strip()


def api_base():
    if '--api' in sys.argv:
        return sys.argv[sys.argv.index('--api') + 1].rstrip('/')
    return os.environ.get('OND_API_BASE', API_PADRAO).rstrip('/')


def vitrine(api, idioma):
    url = '%s/api/showcase/destinations?locale=%s' % (api, idioma)
    with urllib.request.urlopen(urllib.request.Request(url, headers={'Accept': 'application/json'}), timeout=60) as r:
        return json.load(r)


def carrega_i18n_home():
    spec = importlib.util.spec_from_file_location('i18n_home', os.path.join(ROOT, 'build-i18n-home.py'))
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def foto(d):
    local = '/assets/viagens/%s.jpg' % d['slug']
    if os.path.exists(os.path.join(ROOT, local.lstrip('/'))):
        webp = local.replace('.jpg', '.webp')
        return local, webp if os.path.exists(os.path.join(ROOT, webp.lstrip('/'))) else None
    return d['image'], None


def destino_frase(d, idioma):
    if idioma == 'pt':
        return re.sub(r'^Viaje para ', '', d['headline'])
    return d['title']


def wa_link(numero, texto):
    return 'https://wa.me/%s?text=%s' % (numero, urllib.parse.quote(texto, safe='/'))


ICO = ('<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
       'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>')
PIN = ICO % '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
REL = ICO % '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
CAL = ICO % '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'
GRU = ICO % '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
DOC = ICO % '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>'
SETA = ('<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>')
WAI = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 '
       '11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 '
       '12.04 2zm5.8 14.03c-.25.7-1.44 1.33-2.01 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.93'
       '-4.29-5.08-4.49-.14-.2-1.21-1.61-1.21-3.08s.77-2.18 1.04-2.48c.27-.3.59-.37.79-.37h.57c.18.01.43-.07.67.51.25'
       '.6.84 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.32.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.28 '
       '1.66 2.07 1.14 1.02 2.1 1.34 2.4 1.49.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 '
       '2.01.96.3.15.5.22.57.35.07.12.07.72-.18 1.41z"/></svg>')


def item(icone, texto):
    return '<li>%s<span>%s</span></li>' % (icone, html.escape(texto))


def dias(d, T, idioma):
    return T['dias'][idioma].format(min=d['minDays'], max=d['maxDays'])


def ficha(d, idioma, T):
    pasta = IDIOMAS[idioma]['pasta']
    e = html.escape
    src, webp = foto(d)
    fonte = '<source srcset="%s" type="image/webp">' % webp if webp else ''
    mais = [item(CAL, d['bestSeason'])] if d.get('bestSeason') else []
    mais += [item(GRU, d['idealFor'])] if d.get('idealFor') else []
    mais += [item(DOC, d['documentNote'])] if d.get('documentNote') else []
    destaques = ''
    if d.get('highlights'):
        destaques = '<p class="dc-hl2"><b>%s</b> %s</p>' % (e(T['destaques'][idioma]), e(', '.join(d['highlights'])))
    catalogo = '%s/%sviagens/#%s' % (SITE, pasta, d['slug'])
    wa = wa_link(WA_VENDA, T['waCard'][idioma].format(destino=destino_frase(d, idioma), url=catalogo))
    return f"""      <article class="dc" id="{d['slug']}" data-ocas="{' '.join(sorted(OCASIAO[o] for o in d['occasions']))}" data-meses="{' '.join(MESES[m - 1] for m in d['bestMonths'])}" data-dur="{DURACAO[d['duration']]}" data-pais="{d['countryCode']}">
        <div class="dc-txt">
          <h3><a href="/{pasta}viagens/{d['slug']}/">{e(d['headline'])}</a></h3>
          <div class="dc-sob">{e(T['precoSob'][idioma])}</div>
          <p class="dc-desc">{e(d['description'])}</p>
          <ul class="dc-info dc-curta">{item(PIN, d['region'])}{item(REL, dias(d, T, idioma))}</ul>
          <details class="dc-mais"><summary>{e(T['verDetalhes'][idioma])}{SETA}</summary><ul class="dc-info">{''.join(mais)}</ul>{destaques}</details>
          <div class="dc-bot">
            <a class="dc-cta wa-btn" href="{wa}" target="_blank" rel="noopener" data-wa="{e(d['title'])}">{WAI}{e(T['quero'][idioma])}</a>
          </div>
        </div>
        <div class="dc-foto"><picture>{fonte}<img src="{src}" alt="{e(d.get('imageAlt') or d['title'])}" width="800" height="500" loading="lazy"></picture></div>
      </article>
"""


def abas(idioma, T, nome_pais, locais, mundo, alvo, fixa=False):
    e = html.escape
    botoes = []
    for chave, rotulo, n in (('nacionais', nome_pais, locais), ('internacionais', T['mundo'][idioma], mundo)):
        on = chave == alvo
        if fixa:
            botoes.append('<button type="button" data-alvo="%s" tabindex="-1" class="%s">%s <span>%d</span></button>'
                          % (chave, 'on' if on else '', e(rotulo), n))
        else:
            botoes.append('<button type="button" role="tab" data-alvo="%s" aria-controls="%s" aria-selected="%s"%s class="%s">%s <span>%d</span></button>'
                          % (chave, chave, 'true' if on else 'false', '' if on else ' tabindex="-1"', 'on' if on else '', e(rotulo), n))
    if fixa:
        return '<div class="vg-sw vg-sw-fixo" aria-hidden="true">%s</div>' % ''.join(botoes)
    return '<div class="vg-sw" role="tablist" aria-label="%s">%s</div>' % (e(T['abasAria'][idioma]), ''.join(botoes))


def bloco(ds, idioma, T):
    e = html.escape
    pais = IDIOMAS[idioma]['pais']
    locais = [d for d in ds if d['countryCode'] == pais]
    mundo = [d for d in ds if d['countryCode'] != pais]
    nome_pais = next((d['countryName'] for d in locais), pais)
    titulo_pais = T['h2Brasil'][idioma] if pais == 'BR' else T['h2Pais'][idioma]
    texto_pais = T['pBrasil'][idioma] if pais == 'BR' else T['pPais'][idioma]
    wa_outro = wa_link(WA_PAGINA, T['waOutro'][idioma])
    extra = (f'<div class="dc-extra"><h3>{e(T["extraTitulo"][idioma])}</h3><p>{e(T["extraTexto"][idioma])}</p><div>'
             f'<a class="vt-btn vt-btn-wa wa-btn" href="{wa_outro}" target="_blank" rel="noopener" data-wa="outro destino">{e(T["extraBotao"][idioma])}</a>'
             f'<button type="button" class="vt-btn vt-btn-ghost" onclick="if(window.openGlobe){{openGlobe(event)}}">{e(T["extraGlobo"][idioma])}</button></div></div>\n')
    dados = (' data-pais-padrao="%s" data-idioma="%s" data-titulo-pais="%s" data-texto-pais="%s" data-titulo-padrao="%s" data-texto-padrao="%s" data-titulo-brasil="%s" data-texto-brasil="%s" data-mundo="%s" data-ver-todos="%s"'
             % (pais, idioma, e(T['h2Pais'][idioma]), e(T['pPais'][idioma]), e(titulo_pais), e(texto_pais),
                e(T['h2Brasil'][idioma]), e(T['pBrasil'][idioma]), e(T['mundo'][idioma]), e(T['todos'][idioma])))
    return (INICIO
            + '  <div class="vt-in vg-pais"><label for="vg-pais">%s</label> <span class="vgf-sel"><select id="vg-pais"><option value="%s">%s</option></select></span></div>\n'
            % (e(T['viajandoDe'][idioma]), pais, e(nome_pais))
            + '  <div class="vg-bar">%s</div>\n' % abas(idioma, T, nome_pais, len(locais), len(mundo), 'nacionais', fixa=True)
            + '  <section class="vg" id="nacionais" role="tabpanel" aria-label="%s"%s>\n' % (e(T['painelPais'][idioma]), dados)
            + '    <div class="vt-in vt-head"><h2>%s</h2><div class="vg-hd-r"><p>%s</p>%s</div></div>\n'
            % (e(titulo_pais), e(texto_pais), abas(idioma, T, nome_pais, len(locais), len(mundo), 'nacionais'))
            + '    <div class="vt-grid2">\n' + ''.join(ficha(d, idioma, T) for d in locais) + '    </div>\n  </section>\n'
            + '  <section class="vg" id="internacionais" role="tabpanel" aria-label="%s" hidden>\n' % e(T['painelMundo'][idioma])
            + '    <div class="vt-in vt-head"><h2>%s</h2><div class="vg-hd-r"><p>%s</p>%s</div></div>\n'
            % (e(T['h2Mundo'][idioma]), e(T['pMundo'][idioma]), abas(idioma, T, nome_pais, len(locais), len(mundo), 'internacionais'))
            + '    <div class="vt-grid2">\n' + ''.join(ficha(d, idioma, T) for d in mundo) + '    ' + extra + '    </div>\n  </section>\n'
            + FIM)


def troca_bloco(pagina, novo):
    i, j = pagina.index(INICIO), pagina.index(FIM) + len(FIM)
    return pagina[:i] + novo + pagina[j:]


def alternativos(caminho):
    links = ['<link rel="alternate" hreflang="%s" href="%s/%s%s">' % (cfg['html'], SITE, cfg['pasta'], caminho)
             for cfg in IDIOMAS.values()]
    links.append('<link rel="alternate" hreflang="x-default" href="%s/%s">' % (SITE, caminho))
    return '\n'.join(links)


def com_alternativos(doc, caminho):
    doc = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n', '', doc)
    return re.sub(r'(<link rel="canonical" href="[^"]*">\n)', lambda m: m.group(1) + alternativos(caminho) + '\n', doc, count=1)


def catalogo_traduzido(pt, idioma, i18n, dicionario):
    cfg = IDIOMAS[idioma]
    faltando = set()
    scripts = []

    def guarda(m):
        scripts.append(m.group(0))
        return '<script data-vitrine-guardado="%d"></script>' % (len(scripts) - 1)

    doc = re.sub(r'(?s)<script\b[^>]*>.*?</script>', guarda, pt)
    i, j = doc.index(INICIO), doc.index(FIM) + len(FIM)
    scripts.append(doc[i:j])
    doc = doc[:i] + '<script data-vitrine-guardado="%d"></script>' % (len(scripts) - 1) + doc[j:]
    doc = i18n.traduz(doc, dicionario, idioma, faltando)
    doc = re.sub(r'<script data-vitrine-guardado="(\d+)"></script>', lambda m: scripts[int(m.group(1))], doc)
    url = '%s/%sviagens/' % (SITE, cfg['pasta'])
    doc = doc.replace('<html lang="pt-BR"', '<html lang="%s"' % cfg['html'], 1)
    doc = doc.replace('<meta property="og:locale" content="pt_BR">', '<meta property="og:locale" content="%s">' % cfg['og'], 1)
    doc = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % url, doc, count=1)
    doc = re.sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % url, doc, count=1)
    doc = doc.replace('href="/viagens/"', 'href="/%sviagens/"' % cfg['pasta']).replace('href="/"', 'href="/%s"' % cfg['pasta'])
    return doc, faltando


POSTS_ALIAS = {'fernando de noronha': 'noronha', 'lençóis maranhenses': 'lencois', 'foz do iguaçu': 'iguaçu'}


def posts(blog):
    fora = []
    for m in re.finditer(r'href="/blog/([a-z0-9-]+)/"[^>]*>(.*?)</a>', blog, re.S):
        slug, corpo = m.group(1), m.group(2)
        t = re.search(r'<h[23][^>]*>(.*?)</h[23]>', corpo, re.S)
        if t and not any(p[0] == slug for p in fora):
            fora.append((slug, limpa(t.group(1))))
    return fora


def relacionados(d, ps):
    chave = d['title'].lower()
    termo = POSTS_ALIAS.get(chave, chave)
    return [(s, t) for s, t in ps if termo.split()[0] in (s + ' ' + t.lower())][:3]


def pagina(d, idioma, T, cab, rod, rel, outros, css):
    cfg = IDIOMAS[idioma]
    e = html.escape
    pasta = cfg['pasta']
    url = '%s/%sviagens/%s/' % (SITE, pasta, d['slug'])
    src, webp = foto(d)
    foto_abs = src if src.startswith('http') else SITE + src
    titulo = T['tituloPagina'][idioma].format(destino=d['title'])
    desc = ('%s %s' % (d['description'], T['descPagina'][idioma]))[:158]
    og = T['ogTitulo'][idioma].format(chamada=d['headline'])
    wa = wa_link(WA_PAGINA, T['waPagina'][idioma].format(destino=destino_frase(d, idioma)))
    info = item(PIN, d['region']) + item(REL, dias(d, T, idioma))
    info += item(GRU, d['idealFor']) if d.get('idealFor') else ''
    hl = ''.join('<li>%s</li>' % e(x) for x in d.get('highlights') or [])
    nota = '<p class="dp-nota">%s</p>' % e(d['documentNote']) if d.get('documentNote') else ''
    calendario = (' <a class="dp-sec" href="/viagens/quando-viajar/">Calendário completo por destino</a>.'
                  if idioma == 'pt' else '')
    quando = ('<h2>%s</h2><p class="dp-lead">%s.%s</p>' % (e(T['quandoIr'][idioma]), e(d['bestSeason'].rstrip('.')), calendario)
              if d.get('bestSeason') else '')
    posts_html = ''
    if rel:
        posts_html = ('<h2>Para ler antes de ir</h2><ul class="dp-posts">'
                      + ''.join('<li><a href="/blog/%s/">%s</a></li>' % (s, e(t)) for s, t in rel) + '</ul>')
    fonte = '<source srcset="%s" type="image/webp">' % webp if webp else ''
    ld = {
        '@context': 'https://schema.org', '@type': 'TouristDestination', 'name': d['title'], 'url': url,
        'description': d['description'], 'image': foto_abs, 'inLanguage': cfg['html'],
        'containedInPlace': {'@type': 'Place', 'name': d['region']},
        'geo': {'@type': 'GeoCoordinates', 'latitude': d.get('latitude'), 'longitude': d.get('longitude')},
        'includesAttraction': [{'@type': 'TouristAttraction', 'name': x} for x in d.get('highlights') or []],
        'isPartOf': {'@type': 'CollectionPage', 'url': '%s/%sviagens/' % (SITE, pasta)},
    }
    trilha = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': T['inicio'][idioma], 'item': '%s/%s' % (SITE, pasta)},
        {'@type': 'ListItem', 'position': 2, 'name': T['viagens'][idioma], 'item': '%s/%sviagens/' % (SITE, pasta)},
        {'@type': 'ListItem', 'position': 3, 'name': d['title'], 'item': url}]}
    return f"""<!DOCTYPE html>
<html lang="{cfg['html']}" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="apple-itunes-app" content="app-id=6758392427">
<script src="/assets/edicoes-faixa.js" defer></script>
<meta name="theme-color" content="#0d0d14">
<title>{e(titulo)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" type="image/svg+xml" href="/assets/ond-symbol.svg">
<link rel="canonical" href="{url}">
{alternativos('viagens/%s/' % d['slug'])}
<meta property="og:type" content="article">
<meta property="og:site_name" content="OND">
<meta property="og:locale" content="{cfg['og']}">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(og)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{foto_abs}">
<meta property="og:image:alt" content="{e(d.get('imageAlt') or d['title'])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(og)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{foto_abs}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/tokens/ond-core.css">
<link rel="stylesheet" href="/tokens/ond-b2c.css">
<link rel="stylesheet" href="/assets/site-base.css">
<link rel="stylesheet" href="/assets/acessibilidade.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(trilha, ensure_ascii=False)}</script>
<script>try{{if(localStorage.getItem('ond_theme')==='light')document.documentElement.setAttribute('data-theme','light')}}catch(e){{}}</script>
<style id="a11y-base">:root{{color-scheme:dark}}[data-theme="light"]{{color-scheme:light}}html{{scroll-padding-top:90px}}a,button,summary{{touch-action:manipulation}}.skip{{position:absolute;left:12px;top:-60px;z-index:100000;background:var(--purple,#7f11f4);color:#fff;padding:10px 16px;border-radius:10px;font-weight:700;text-decoration:none;transition:top .2s}}.skip:focus{{top:12px}}</style>
{css}
<script src="/assets/ond-logo.js" defer></script>
</head>
<body>
<a class="skip" href="#conteudo">{e(T['pular'][idioma])}</a>
{cab}
<main class="dp" id="conteudo">
  <div class="dp-in">
    <nav class="dp-bc" aria-label="{e(T['voceEsta'][idioma])}"><a href="/{pasta}">{e(T['inicio'][idioma])}</a> / <a href="/{pasta}viagens/">{e(T['viagens'][idioma])}</a> / {e(d['title'])}</nav>
    <div class="dp-capa"><picture>{fonte}<img src="{src}" alt="{e(d.get('imageAlt') or d['title'])}" width="1200" height="514" fetchpriority="high"></picture></div>
    <h1>{e(d['headline'])}</h1>
    <div class="dp-sob">{e(T['precoSob'][idioma])}</div>
    <p class="dp-lead">{e(d['description'])}</p>
    <ul class="dp-info">{info}</ul>
    <div class="dp-cta">
      <a class="dp-wa" href="{wa}" target="_blank" rel="noopener" data-wa="destino: {e(d['title'])}">{WAI}{e(T['quero'][idioma])}</a>
      <a class="dp-sec" href="/{pasta}viagens/">{e(T['todos'][idioma])}</a>
    </div>
    <h2>{e(T['oQueEntra'][idioma])}</h2>
    <ul class="dp-hl">{hl}</ul>
    {nota}
    {quando}
    <h2>{e(T['comoMonta'][idioma])}</h2>
    <p class="dp-lead">{e(T['comoMontaTexto'][idioma])}</p>
    {posts_html}
    <h2>{e(T['outros'][idioma])}</h2>
    <ul class="dp-outros">{outros}</ul>
  </div>
</main>
<script src="/assets/a11y.js" defer></script>
<script src="/assets/busca.js" defer></script>
{rod}
<script src="/assets/analytics.js" defer></script>
</body>
</html>
"""


CSS = """<style id="dest-css">
.dp{--l:var(--border);padding-bottom:60px}
.dp-in{max-width:1080px;margin:0 auto;padding:0 24px}
.dp-bc{font-size:.85rem;color:var(--muted);padding:26px 0 10px}
.dp-bc a{color:var(--muted);text-decoration:none}.dp-bc a:hover{color:var(--text)}
.dp-capa{position:relative;border-radius:18px;overflow:hidden;aspect-ratio:21/9;background:var(--surface)}
.dp-capa img{width:100%;height:100%;object-fit:cover;display:block}
.dp h1{font-size:clamp(2rem,4.4vw,3.4rem);line-height:1.05;letter-spacing:-.03em;margin:26px 0 6px}
.dp-sob{color:var(--muted);font-weight:700;font-size:.95rem}
.dp-lead{font-size:1.12rem;line-height:1.65;color:var(--muted);max-width:60ch;margin-top:16px}
.dp-info{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:28px 0 0;padding:0}
.dp-info li{display:flex;gap:10px;align-items:flex-start;background:var(--surface);border:1px solid var(--l);border-radius:14px;padding:13px 15px;font-size:.92rem;line-height:1.45}
.dp-info .ico{color:var(--purple-light);flex:none;margin-top:2px}
.dp h2{font-size:clamp(1.3rem,2.4vw,1.75rem);letter-spacing:-.02em;margin:40px 0 14px}
.dp-hl{list-style:none;display:grid;gap:10px;padding:0;margin:0}
.dp-hl li{display:flex;gap:10px;align-items:flex-start;line-height:1.5;color:var(--muted)}
.dp-hl li::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--purple);flex:none;margin-top:8px}
.dp-nota{background:var(--surface);border:1px solid var(--l);border-radius:14px;padding:14px 16px;color:var(--muted);font-size:.92rem;line-height:1.55;margin-top:18px}
.dp-cta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:28px}
.dp-wa{display:inline-flex;align-items:center;gap:9px;background:#25D366;color:#062b14;font-weight:800;padding:13px 22px;border-radius:50px;text-decoration:none}
.dp-wa svg{width:20px;height:20px}
.dp-wa:hover{filter:brightness(1.06)}
.dp-sec{color:var(--text);font-weight:700;text-decoration:none;border-bottom:1px solid var(--l);padding-bottom:2px}
.dp-posts{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;padding:0;margin:0;list-style:none}
.dp-posts a{display:block;background:var(--surface);border:1px solid var(--l);border-radius:16px;padding:18px;color:var(--text);text-decoration:none;font-weight:700;line-height:1.35;transition:border-color .2s}
.dp-posts a:hover{border-color:var(--purple)}
.dp-outros{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0;list-style:none}
.dp-outros a{display:inline-block;border:1px solid var(--l);border-radius:50px;padding:8px 15px;color:var(--text);text-decoration:none;font-size:.9rem;font-weight:600}
.dp-outros a:hover{border-color:var(--purple)}
@media(max-width:700px){.dp-capa{aspect-ratio:16/10}.dp-in{padding:0 18px}}
</style>"""


def cabecalho_e_rodape(cat):
    cab = (re.search(r'<!-- HEADER -->.*?</header>', cat, re.S).group(0) + '\n'
           + re.search(r'<nav class="mobile-nav".*?</nav>', cat, re.S).group(0) + '\n')
    rod = re.search(r'<!-- FOOTER -->.*?</footer>', cat, re.S).group(0) + '\n'
    cab = cab.replace('class="nav-active"', '').replace('href="/viagens/" >Viagens', 'href="/viagens/">Viagens')
    return cab, rod


def atualiza_sitemap(slugs):
    caminho = os.path.join(ROOT, 'sitemap.xml')
    atual = ler('sitemap.xml') if os.path.exists(caminho) else ''
    fora = re.compile(r'<loc>%s/((en|es|fr|it)/)?viagens/(?!quando-viajar/)' % re.escape(SITE))
    blocos = ['  ' + b.strip() for b in re.findall(r'<url>.*?</url>', atual, re.S) if not fora.search(b)]
    novos = []
    for caminho_url, prioridade in [('viagens/', '0.9')] + [('viagens/%s/' % s, '0.8') for s in slugs]:
        alternativos_xml = ''.join('\n    <xhtml:link rel="alternate" hreflang="%s" href="%s/%s%s"/>'
                                   % (cfg['html'], SITE, cfg['pasta'], caminho_url) for cfg in IDIOMAS.values())
        alternativos_xml += '\n    <xhtml:link rel="alternate" hreflang="x-default" href="%s/%s"/>' % (SITE, caminho_url)
        for idioma, cfg in IDIOMAS.items():
            novos.append('  <url>\n    <loc>%s/%s%s</loc>%s\n    <changefreq>weekly</changefreq>\n    <priority>%s</priority>\n  </url>'
                         % (SITE, cfg['pasta'], caminho_url, alternativos_xml, prioridade if idioma == 'pt' else '0.7'))
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
           + '\n'.join(blocos + novos) + '\n</urlset>\n')
    grava('sitemap.xml', xml)
    print('sitemap.xml: %d urls do catálogo nos cinco idiomas' % len(novos))


def main():
    api = api_base()
    T = json.loads(ler('i18n/vitrine-textos.json'))
    i18n = carrega_i18n_home()
    dicionario = i18n.carrega()
    dicionario.pop('__whatsapp__', None)
    dicionario.update(json.loads(ler('i18n/viagens-traducoes.json')))
    ps = posts(ler('blog.html'))
    pt = ler('viagens/index.html')
    faltando = set()
    paginas = 0
    for idioma, cfg in IDIOMAS.items():
        ds = vitrine(api, idioma)
        if not ds:
            raise SystemExit('A vitrine em %s veio vazia de %s; nada foi gravado.' % (idioma, api))
        if idioma == 'pt':
            pt = com_alternativos(troca_bloco(pt, bloco(ds, idioma, T)), 'viagens/')
            cat = pt
            grava('viagens/index.html', cat)
        else:
            cat, falta = catalogo_traduzido(troca_bloco(pt, bloco(ds, idioma, T)), idioma, i18n, dicionario)
            faltando |= {(idioma, t) for t in falta}
            grava('%sviagens/index.html' % cfg['pasta'], cat)
        cab, rod = cabecalho_e_rodape(cat)
        for d in ds:
            vizinhos = [x for x in ds if (x['countryCode'] == 'BR') == (d['countryCode'] == 'BR') and x['slug'] != d['slug']][:8]
            outros = ''.join('<li><a href="/%sviagens/%s/">%s</a></li>' % (cfg['pasta'], v['slug'], html.escape(v['title']))
                             for v in vizinhos)
            rel = relacionados(d, ps) if idioma == 'pt' else []
            grava('%sviagens/%s/index.html' % (cfg['pasta'], d['slug']), pagina(d, idioma, T, cab, rod, rel, outros, CSS))
            paginas += 1
        print('%s: catálogo e %d páginas de destino, vindos de %s' % (idioma, len(ds), api))
    print('%d páginas de destino no total' % paginas)
    atualiza_sitemap([d['slug'] for d in ds])
    if faltando:
        print('\nsem tradução (ficou em português):')
        for idioma, t in sorted(faltando):
            print('  %s  %s' % (idioma, t[:90]))


if __name__ == '__main__':
    main()
