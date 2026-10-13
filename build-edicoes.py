#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-edicoes.py: faixa das edições temáticas em destaque e uma página por edição.

Fonte única: a API de edições temáticas do backend do OND.
- GET /api/themed-editions/active?language=<idioma> para cada idioma do site
- GET /api/themed-editions/upcoming?language=pt para as edições que ainda vão estrear
- GET /api/themed-editions/<slug>?language=pt para montar a página da edição

Saída:
- assets/edicoes-config.json: textos da faixa por idioma, link de cada edição e as
  páginas que existem. A faixa (assets/edicoes-faixa.js) consulta a API direto no
  navegador e usa este arquivo só para textos e links.
- edicoes/<slug>/index.html: página da edição, perene. Antes da estreia mostra o selo
  "Em breve" com a data e troca sozinha para o botão da trilha quando a data chega.
  Continua no ar depois que a edição sai de cartaz, com o aviso de encerrada no lugar do botão.
- edicoes/registro.json: as edições já publicadas, com o último retrato da API.
  É o que mantém a página de pé quando a edição some do /active.
- o bloco /edicoes/ do sitemap.xml e a tag da faixa nas páginas públicas.

Os textos de interface vêm de i18n/edicoes-textos.json, cópia das chaves do app.

Padrão é produção. Para gerar contra outro backend (dev ou local):
    python build-edicoes.py --api https://dev.agamatec.com
    OND_API_BASE=http://localhost:8080 python build-edicoes.py
Trocar de backend descarta o registro anterior, para não misturar edição de dev
com a de produção.
"""
import os, re, sys, json, html, glob, datetime, argparse, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://ondviajar.com.br'
API_PADRAO = 'https://ond.agamatec.com'
REGISTRO = os.path.join(ROOT, 'edicoes', 'registro.json')
CONFIG = os.path.join(ROOT, 'assets', 'edicoes-config.json')
TEXTOS = os.path.join(ROOT, 'i18n', 'edicoes-textos.json')
TAG_FAIXA = '<script src="/assets/edicoes-faixa.js" defer></script>'
META_APP = '<meta name="apple-itunes-app" content="app-id=6758392427">'
IDIOMAS = ['pt', 'en', 'es', 'fr', 'it']
MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro',
         'outubro', 'novembro', 'dezembro']
ATIVA, EM_BREVE, ENCERRADA = 'ativa', 'em-breve', 'encerrada'
WEB_APP = 'https://web.ondviajar.com.br/ond-vai'

LINK_BRANCH = {
    'los-angeles-2026-10': 'https://ond.app.link/edicao-los-angeles',
    'miami-2026-11': 'https://ond.app.link/edicao-miami-2026',
    'terra-santa-2027-03': 'https://ond.app.link/edicao-terra-santa',
}

COR = re.compile(r'^#[0-9A-Fa-f]{6}$')
COR_PADRAO = {'primaryColor': '#7F11F4', 'secondaryColor': '#290756', 'detailColor': '#11F558'}
CAMPOS = ['slug', 'title', 'summary', 'coverImageUrl', 'startsAt', 'endsAt', 'cityName',
          'primaryColor', 'secondaryColor', 'detailColor']


class SemEdicao(Exception):
    pass


def baixa(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'ond-site/build-edicoes',
                                               'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as erro:
        if erro.code == 404:
            raise SemEdicao(url)
        raise


def link_branch(slug):
    return LINK_BRANCH.get(slug) or 'https://web.ondviajar.com.br/editions/%s' % slug


def cores(edicao):
    return {campo: edicao.get(campo) if COR.match(edicao.get(campo) or '') else padrao
            for campo, padrao in COR_PADRAO.items()}


def texto_sobre(cor_hex):
    r, g, b = (int(cor_hex[pos:pos + 2], 16) / 255 for pos in (1, 3, 5))
    canal = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in (r, g, b)]
    luz = 0.2126 * canal[0] + 0.7152 * canal[1] + 0.0722 * canal[2]
    return '#1E1E1E' if luz > 0.4 else '#FFFFFF'


def ler_json(caminho, padrao):
    if not os.path.exists(caminho):
        return padrao
    with open(caminho, encoding='utf-8') as fh:
        return json.load(fh)


def grava(caminho, conteudo):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    atual = open(caminho, encoding='utf-8').read() if os.path.exists(caminho) else None
    if atual != conteudo:
        with open(caminho, 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(conteudo)


def retrato(edicao):
    fora = {campo: edicao.get(campo) for campo in CAMPOS}
    fora['stops'] = [{'name': parada.get('name') or '', 'description': parada.get('description') or ''}
                     for parada in edicao.get('stops') or []]
    return fora



CSS = """<style id="edicao-css">
.ed{padding-bottom:60px}
.ed-topo{background:linear-gradient(160deg,var(--ed-sec) 0%,#0d0d14 100%);color:#fff}
.ed-in{max-width:1080px;margin:0 auto;padding:0 24px}
.ed-bc{font-size:.85rem;color:rgba(255,255,255,.72);padding:26px 0 10px}
.ed-bc a{color:rgba(255,255,255,.72);text-decoration:none}.ed-bc a:hover{color:#fff}
.ed-capa{border-radius:18px;overflow:hidden;aspect-ratio:21/9;background:rgba(255,255,255,.06)}
.ed-capa img{width:100%;height:100%;object-fit:cover;display:block}
.ed-selo{display:inline-block;margin-top:26px;border:1px solid var(--ed-det);color:var(--ed-det);border-radius:50px;padding:5px 13px;font-size:.8rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
.ed h1{font-size:clamp(2rem,4.4vw,3.4rem);line-height:1.05;letter-spacing:-.03em;margin:14px 0 6px}
.ed-cidade{color:var(--ed-det);font-weight:700;font-size:1rem}
.ed-lead{font-size:1.12rem;line-height:1.65;color:rgba(255,255,255,.82);max-width:62ch;margin:16px 0 0}
.ed-cta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:28px 0 44px}
.ed-bt{display:inline-flex;align-items:center;gap:9px;background:var(--ed-pri);color:var(--ed-pri-txt);font-weight:800;padding:14px 24px;border-radius:50px;text-decoration:none}
.ed-bt:hover{filter:brightness(1.07)}
.ed-fim{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:18px 20px;max-width:62ch}
.ed-fim strong{display:block;font-size:1.05rem;margin-bottom:6px}
.ed-fim p{margin:0 0 14px;color:rgba(255,255,255,.82);line-height:1.55}
.ed h2{font-size:clamp(1.3rem,2.4vw,1.75rem);letter-spacing:-.02em;margin:44px 0 16px}
.ed-paradas{list-style:none;display:grid;gap:14px;padding:0;margin:0}
.ed-paradas li{background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--ed-pri);border-radius:14px;padding:16px 18px}
.ed-num{display:block;color:var(--muted);font-size:.8rem;font-weight:700;letter-spacing:.03em;text-transform:uppercase}
.ed-paradas h3{font-size:1.12rem;margin:4px 0 0;line-height:1.3}
.ed-paradas p{margin:8px 0 0;color:var(--muted);line-height:1.55}
.ed-aviso{color:var(--muted);font-size:.85rem;line-height:1.5;margin-top:36px}
.ed-estreia{font-size:1.05rem;font-weight:700;color:#fff;margin:0}
.ed [hidden]{display:none!important}
.ed-avise{flex-basis:100%;max-width:62ch}
.ed-avise .ed-bt{border:0;cursor:pointer;font:inherit;font-weight:800}
.ed-avise .ed-bt:disabled{opacity:.6;cursor:default}
.ed-form{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:18px 20px;display:grid;gap:12px}
.ed-form strong{font-size:1.05rem}
.ed-form p{margin:0;color:rgba(255,255,255,.82);line-height:1.55}
.ed-form input{font:inherit;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.25);color:#fff}
.ed-form input:focus{outline:2px solid var(--ed-det);outline-offset:1px}
.ed-form .ed-bt{justify-self:start}
.ed-erro{color:#FFB4A9;font-weight:600}
.ed-ok{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px}
.ed-ok p{margin:0;font-weight:700;color:#fff}
.ed-sair{background:none;border:0;color:rgba(255,255,255,.72);text-decoration:underline;cursor:pointer;font:inherit;padding:0}
.ed-oculto{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ed-armadilha{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.ed-form .iti{width:100%}
.ed-form .iti input{width:100%}
.ed-form .iti__selected-dial-code{color:#fff}
.ed-form .iti__arrow{border-top-color:#fff}
.ed-form .iti__country-selector{background:#1d1b2b;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:12px;overflow:hidden}
.ed-form .iti__search-input{border:0;border-radius:0;border-bottom:1px solid rgba(255,255,255,.14);background:transparent}
.ed-form .iti__search-icon,.ed-form .iti__search-clear{color:rgba(255,255,255,.72)}
.ed-form .iti__country.iti__highlight{background:rgba(255,255,255,.1)}
.ed-form .iti__dial-code{color:rgba(255,255,255,.6)}
.ed-form .iti__country-check{color:var(--ed-det)}
@media(max-width:700px){.ed-capa{aspect-ratio:16/10}.ed-in{padding:0 18px}}
</style>"""


def data_por_extenso(inicio):
    data = datetime.date.fromisoformat((inicio or '')[:10])
    return '%d de %s' % (data.day, MESES[data.month - 1])


def acao_da_trilha(slug, textos):
    return ('<div class="ed-cta"><a class="ed-bt" href="%s" target="_blank" rel="noopener" data-edicao="%s">%s</a></div>'
            % (html.escape(link_branch(slug)), html.escape(slug), html.escape(textos['themedEditionCardCta'])))


def formulario_de_aviso(slug, data, textos):
    campo = ('<label class="ed-oculto" for="ed-%s">%s</label>'
             '<input id="ed-%s" name="%s" type="%s" autocomplete="%s" placeholder="%s" required%s>')
    campos = ''.join([
        campo % ('nome', html.escape(textos['hubLeadCaptureName']), 'nome', 'nome', 'text', 'name',
                 html.escape(textos['hubLeadCaptureName']), ' maxlength="150"'),
        campo % ('email', html.escape(textos['hubLeadCaptureEmail']), 'email', 'email', 'email', 'email',
                 html.escape(textos['hubLeadCaptureEmail']), ' inputmode="email" autocapitalize="off" spellcheck="false"'),
        campo % ('telefone', html.escape(textos['hubLeadCapturePhone']), 'telefone', 'telefone', 'tel', 'tel',
                 html.escape(textos['hubLeadCapturePhone']), ' inputmode="tel"'),
    ])
    return ('<div class="ed-avise ed-so-breve" id="ed-avise" hidden data-api="%s" data-slug="%s">'
            '<button type="button" class="ed-bt" data-acao="abrir">%s</button>'
            '<form class="ed-form" hidden novalidate><strong>%s</strong><p>%s</p>%s'
            '<input class="ed-armadilha" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">'
            '<button type="submit" class="ed-bt">%s</button></form>'
            '<div class="ed-ok" hidden><p>%s</p><button type="button" class="ed-sair" data-acao="sair">%s</button></div>'
            '<p class="ed-erro" role="alert" hidden>%s</p></div>'
            % (API_PADRAO, html.escape(slug), html.escape(textos['themedEditionPremiereNoticeCta']),
               html.escape(textos['themedEditionPremiereNoticeTitle']),
               html.escape(textos['themedEditionPremiereNoticeBody'].replace('{date}', data)), campos,
               html.escape(textos['hubLeadCaptureSend']),
               html.escape(textos['themedEditionPremiereNoticeConfirmed'].replace('{date}', data)),
               html.escape(textos['themedEditionPremiereNoticeLeave']), html.escape(textos['ondVaiError'])))


def pagina(edicao, estado, textos, cab, rod):
    slug = edicao['slug']
    titulo = edicao.get('title') or slug
    resumo = edicao.get('summary') or ''
    cidade = edicao.get('cityName') or ''
    capa = edicao.get('coverImageUrl') or ''
    paleta = cores(edicao)
    url = '%s/edicoes/%s/' % (SITE, slug)
    imagem_og = capa or SITE + '/assets/og-cover.jpg'
    descricao = (resumo or titulo)[:158]
    paradas = edicao.get('stops') or []
    total = len(paradas)

    itens = []
    for posicao, parada in enumerate(paradas, start=1):
        contador = textos['themedEditionStopCounter'].replace('{current}', str(posicao)).replace('{total}', str(total))
        corpo = '<p>%s</p>' % html.escape(parada['description']) if parada['description'] else ''
        itens.append('<li><span class="ed-num">%s</span><h3>%s</h3>%s</li>'
                     % (html.escape(contador), html.escape(parada['name']), corpo))
    lista = ('<h2>%s</h2>\n    <ol class="ed-paradas">%s</ol>' % (html.escape(textos['themedEditionStopsTitle']), ''.join(itens))
             if itens else '')

    selo = html.escape(textos['themedEditionCardBadge'])
    troca_na_estreia = ''
    if estado == ATIVA:
        acao = acao_da_trilha(slug, textos)
    elif estado == EM_BREVE:
        data = data_por_extenso(edicao.get('startsAt'))
        estreia = html.escape(textos['themedEditionUpcomingBody'].replace('{date}', data))
        selo = ('<span class="ed-so-breve">%s</span><span class="ed-so-ativa" hidden>%s</span>'
                % (html.escape(textos['themedEditionUpcomingBadge']), selo))
        acao = ('<div class="ed-cta ed-so-breve"><p class="ed-estreia">%s</p>%s</div>'
                '<div class="ed-so-ativa" hidden>%s</div>'
                % (estreia, formulario_de_aviso(slug, data, textos), acao_da_trilha(slug, textos)))
        troca_na_estreia = ('<script>(function(){var inicio=Date.parse(%s+"-03:00");if(!(Date.now()>=inicio))return;'
                            'document.querySelectorAll(".ed-so-breve").forEach(function(e){e.hidden=true});'
                            'document.querySelectorAll(".ed-so-ativa").forEach(function(e){e.hidden=false})})();</script>'
                            % json.dumps((edicao.get('startsAt') or '')[:19])
                            + '\n<script src="/assets/edicoes-aviso.js" defer></script>')
    else:
        acao = ('<div class="ed-cta"><div class="ed-fim"><strong>%s</strong><p>%s</p>'
                '<a class="ed-bt" href="%s" target="_blank" rel="noopener">Monte sua viagem</a></div></div>'
                % (html.escape(textos['themedEditionEndedTitle']), html.escape(textos['themedEditionEndedBody']), WEB_APP))

    capa_html = ('<div class="ed-capa"><img src="%s" alt="%s" width="1200" height="514" fetchpriority="high"></div>'
                 % (html.escape(capa), html.escape(titulo)) if capa else '')

    ld = {'@context': 'https://schema.org', '@type': 'TouristTrip', 'name': titulo, 'url': url,
          'description': resumo, 'inLanguage': 'pt-BR',
          'itinerary': {'@type': 'ItemList', 'numberOfItems': total, 'itemListElement': [
              {'@type': 'ListItem', 'position': posicao, 'item': {'@type': 'TouristAttraction', 'name': parada['name']}}
              for posicao, parada in enumerate(paradas, start=1)]}}
    if capa:
        ld['image'] = capa
    trilha = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Início', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': titulo, 'item': url}]}
    estilo = '--ed-pri:%s;--ed-sec:%s;--ed-det:%s;--ed-pri-txt:%s' % (
        paleta['primaryColor'], paleta['secondaryColor'], paleta['detailColor'], texto_sobre(paleta['primaryColor']))

    return f"""<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
{META_APP}
{TAG_FAIXA}
<meta name="theme-color" content="{paleta['secondaryColor']}">
<title>{html.escape(titulo)} | OND</title>
<meta name="description" content="{html.escape(descricao)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" type="image/svg+xml" href="/assets/ond-symbol.svg">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="OND">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{html.escape(titulo)}">
<meta property="og:description" content="{html.escape(descricao)}">
<meta property="og:image" content="{html.escape(imagem_og)}">
<meta property="og:image:alt" content="{html.escape(titulo)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{html.escape(titulo)}">
<meta name="twitter:description" content="{html.escape(descricao)}">
<meta name="twitter:image" content="{html.escape(imagem_og)}">
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
{CSS}
<script src="/assets/ond-logo.js" defer></script>
</head>
<body>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
{cab}
<main class="ed" id="conteudo" style="{estilo}">
  <div class="ed-topo">
    <div class="ed-in">
      <nav class="ed-bc" aria-label="Você está em"><a href="/">Início</a> / {html.escape(titulo)}</nav>
      {capa_html}
      <span class="ed-selo">{selo}</span>
      <h1>{html.escape(titulo)}</h1>
      {'<div class="ed-cidade">' + html.escape(cidade) + '</div>' if cidade else ''}
      {'<p class="ed-lead">' + html.escape(resumo) + '</p>' if resumo else ''}
      {acao}
    </div>
  </div>
  <div class="ed-in">
    {lista}
    <p class="ed-aviso">{html.escape(textos['themedEditionDisclaimer'])}</p>
  </div>
</main>
{troca_na_estreia}
<script src="/assets/a11y.js" defer></script>
<script src="/assets/busca.js" defer></script>
{rod}
</body>
</html>
"""


def cabecalho_e_rodape():
    with open(os.path.join(ROOT, 'viagens', 'index.html'), encoding='utf-8') as fh:
        cat = fh.read().replace('\r\n', '\n')
    cab = (re.search(r'<!-- HEADER -->.*?</header>', cat, re.S).group(0) + '\n'
           + re.search(r'<nav class="mobile-nav".*?</nav>', cat, re.S).group(0) + '\n')
    rod = re.search(r'<!-- FOOTER -->.*?</footer>', cat, re.S).group(0) + '\n'
    cab = cab.replace('class="nav-active"', '').replace('href="/viagens/" >Viagens', 'href="/viagens/">Viagens')
    return cab, rod



def atualiza_sitemap(registro):
    caminho = os.path.join(ROOT, 'sitemap.xml')
    with open(caminho, encoding='utf-8') as fh:
        xml = fh.read()
    xml = re.sub(r'\n?[ \t]*<url>(?:(?!</url>).)*?/edicoes/(?:(?!</url>).)*?</url>', '', xml, flags=re.S)
    blocos = ''.join(
        '\n  <url>\n    <loc>%s/edicoes/%s/</loc>\n    <lastmod>%s</lastmod>\n'
        '    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>'
        % (SITE, slug, registro['edicoes'][slug]['atualizadaEm']) for slug in sorted(registro['edicoes']))
    xml = xml.replace('\n</urlset>', blocos + '\n</urlset>')
    grava(caminho, xml)


def garante_tag_faixa():
    """Toda página pública B2C (as que têm o banner do app) carrega o JS da faixa."""
    alteradas = 0
    for arquivo in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
        rel = os.path.relpath(arquivo, ROOT).replace('\\', '/')
        if rel.split('/')[0] in ('i18n', 'relatorios', 'proposta', 'cliente', 'node_modules'):
            continue
        with open(arquivo, encoding='utf-8', newline='') as fh:
            conteudo = fh.read()
        if META_APP not in conteudo or TAG_FAIXA in conteudo:
            continue
        quebra = '\r\n' if '\r\n' in conteudo else '\n'
        conteudo = conteudo.replace(META_APP, META_APP + quebra + TAG_FAIXA, 1)
        with open(arquivo, 'w', encoding='utf-8', newline='') as fh:
            fh.write(conteudo)
        alteradas += 1
    if alteradas:
        print('tag da faixa colocada em %d página(s)' % alteradas)



def estado_da_edicao(slug, ativos, proximas):
    if slug in ativos:
        return ATIVA
    return EM_BREVE if slug in proximas else ENCERRADA


def main():
    parser = argparse.ArgumentParser(description='Faixa e páginas das edições temáticas.')
    parser.add_argument('--api', default=os.environ.get('OND_API_BASE') or API_PADRAO,
                        help='endereço base do backend (padrão: produção)')
    api = parser.parse_args().api.rstrip('/')
    print('Consultando as edições em %s' % api)

    textos = ler_json(TEXTOS, {})
    ativas_por_idioma = {}
    for idioma in IDIOMAS:
        try:
            ativas_por_idioma[idioma] = baixa('%s/api/themed-editions/active?language=%s' % (api, idioma))
        except SemEdicao:
            ativas_por_idioma[idioma] = []
        print('  %s: %d edição(ões) em destaque' % (idioma, len(ativas_por_idioma[idioma])))
    try:
        proximas = {edicao['slug'] for edicao in baixa('%s/api/themed-editions/upcoming?language=pt' % api)}
    except SemEdicao:
        proximas = set()
    print('  %d edição(ões) para estrear' % len(proximas))

    registro = ler_json(REGISTRO, {'origem': api, 'edicoes': {}})
    if registro.get('origem') != api:
        print('  o registro veio de %s, começando do zero para %s' % (registro.get('origem'), api))
        registro = {'origem': api, 'edicoes': {}}

    hoje = datetime.date.today().isoformat()
    ativos = {edicao['slug'] for edicao in ativas_por_idioma['pt']}
    for slug in sorted(ativos | proximas | set(registro['edicoes'])):
        anterior = registro['edicoes'].get(slug)
        try:
            novo = retrato(baixa('%s/api/themed-editions/%s?language=pt' % (api, slug)))
        except SemEdicao:
            if not anterior:
                print('  %s está em destaque mas a edição completa ainda não abriu, fica para a próxima' % slug)
                continue
            novo = anterior['edicao']
        if not anterior or anterior['edicao'] != novo:
            registro['edicoes'][slug] = {'edicao': novo, 'atualizadaEm': hoje}
            print('  %s: página %s' % (slug, 'nova' if not anterior else 'atualizada'))

    cab, rod = cabecalho_e_rodape()
    pasta = os.path.join(ROOT, 'edicoes')
    for slug, entrada in registro['edicoes'].items():
        grava(os.path.join(pasta, slug, 'index.html'),
              pagina(entrada['edicao'], estado_da_edicao(slug, ativos, proximas), textos['pt'], cab, rod))
    for sobra in glob.glob(os.path.join(pasta, '*', 'index.html')):
        slug = os.path.basename(os.path.dirname(sobra))
        if slug not in registro['edicoes']:
            os.remove(sobra)
            os.rmdir(os.path.dirname(sobra))
            print('  %s: página removida, não está no registro de %s' % (slug, api))
    grava(REGISTRO, json.dumps(registro, ensure_ascii=False, indent=2, sort_keys=True) + '\n')

    config = {'api': API_PADRAO,
              'textos': {idioma: {'badge': textos[idioma]['themedEditionCardBadge'],
                                  'cta': textos[idioma]['themedEditionCardCta'],
                                  'badgeUpcoming': textos[idioma]['themedEditionUpcomingBadge'],
                                  'upcomingBody': textos[idioma]['themedEditionUpcomingBody']} for idioma in IDIOMAS},
              'links': LINK_BRANCH,
              'paginas': sorted(registro['edicoes'])}
    grava(CONFIG, json.dumps(config, ensure_ascii=False, indent=1, sort_keys=True) + '\n')

    atualiza_sitemap(registro)
    garante_tag_faixa()
    print('%d página(s) de edição, %d edição(ões) em destaque agora em português'
          % (len(registro['edicoes']), len(ativas_por_idioma['pt'])))


if __name__ == '__main__':
    main()
