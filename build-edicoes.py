#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-edicoes.py: faixa das edições temáticas em destaque e uma página por edição.

Fonte única: a API de edições temáticas do backend do OND.
- GET /api/themed-editions/active?language=<idioma> para cada idioma do site
- GET /api/themed-editions/<slug>?language=pt para montar a página da edição

Saída:
- assets/edicoes-config.json: textos da faixa por idioma, link de cada edição e as
  páginas que existem. A faixa (assets/edicoes-faixa.js) consulta a API direto no
  navegador e usa este arquivo só para textos e links.
- edicoes/<slug>/index.html: página da edição, perene. Continua no ar depois que a
  edição sai de cartaz, com o aviso de encerrada no lugar do botão.
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
@media(max-width:700px){.ed-capa{aspect-ratio:16/10}.ed-in{padding:0 18px}}
</style>"""


def pagina(edicao, ativa, textos, cab, rod):
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

    if ativa:
        acao = ('<div class="ed-cta"><a class="ed-bt" href="%s" target="_blank" rel="noopener" data-edicao="%s">%s</a></div>'
                % (html.escape(link_branch(slug)), html.escape(slug), html.escape(textos['themedEditionCardCta'])))
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
      <span class="ed-selo">{html.escape(textos['themedEditionCardBadge'])}</span>
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

    registro = ler_json(REGISTRO, {'origem': api, 'edicoes': {}})
    if registro.get('origem') != api:
        print('  o registro veio de %s, começando do zero para %s' % (registro.get('origem'), api))
        registro = {'origem': api, 'edicoes': {}}

    hoje = datetime.date.today().isoformat()
    ativos = {edicao['slug'] for edicao in ativas_por_idioma['pt']}
    for slug in sorted(ativos | set(registro['edicoes'])):
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
              pagina(entrada['edicao'], slug in ativos, textos['pt'], cab, rod))
    for sobra in glob.glob(os.path.join(pasta, '*', 'index.html')):
        slug = os.path.basename(os.path.dirname(sobra))
        if slug not in registro['edicoes']:
            os.remove(sobra)
            os.rmdir(os.path.dirname(sobra))
            print('  %s: página removida, não está no registro de %s' % (slug, api))
    grava(REGISTRO, json.dumps(registro, ensure_ascii=False, indent=2, sort_keys=True) + '\n')

    config = {'api': API_PADRAO,
              'textos': {idioma: {'badge': textos[idioma]['themedEditionCardBadge'],
                                  'cta': textos[idioma]['themedEditionCardCta']} for idioma in IDIOMAS},
              'links': LINK_BRANCH,
              'paginas': sorted(registro['edicoes'])}
    grava(CONFIG, json.dumps(config, ensure_ascii=False, indent=1, sort_keys=True) + '\n')

    atualiza_sitemap(registro)
    garante_tag_faixa()
    print('%d página(s) de edição, %d edição(ões) em destaque agora em português'
          % (len(registro['edicoes']), len(ativas_por_idioma['pt'])))


if __name__ == '__main__':
    main()
