#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-destinos.py: gera uma página própria para cada destino do catálogo.

Fonte única: as fichas (<article class="dc">) de viagens/index.html, mais os meses de
viagens/quando-viajar/index.html e os posts do blog (blog.html) para os links relacionados.
Saída: viagens/<slug>/index.html, com cabeçalho e rodapé iguais aos do catálogo.

Rode depois de mexer no catálogo:  python build-destinos.py
"""
import os, re, json, html, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://ondviajar.com.br'
WA = '5511943615412'


def ler(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as fh:
        return fh.read().replace('\r\n', '\n')


def limpa(t):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t)).strip()


def fichas(cat):
    fora = []
    for m in re.finditer(r'<article class="dc" id="([^"]+)">(.*?)</article>', cat, re.S):
        slug, corpo = m.group(1), m.group(2)
        lis = [limpa(x) for x in re.findall(r'<li>.*?<span>(.*?)</span></li>', corpo, re.S)]
        hl = re.search(r'<p class="dc-hl2"><b>Destaques:</b>(.*?)</p>', corpo, re.S)
        nota = re.search(r'<p class="dc-nota">(.*?)</p>', corpo, re.S)
        img = re.search(r'<img src="([^"]+)" alt="([^"]*)"', corpo)
        d = {
            'slug': slug,
            'nome': limpa(re.search(r'<h3>(?:<a[^>]*>)?Viaje para (.*?)(?:</a>)?</h3>', corpo, re.S).group(1)),
            'desc': limpa(re.search(r'<p class="dc-desc">(.*?)</p>', corpo, re.S).group(1)),
            'info': lis,
            'destaques': [x.strip() for x in limpa(hl.group(1)).split('·')] if hl else [],
            'nota': limpa(nota.group(1)) if nota else '',
            'foto': img.group(1), 'alt': img.group(2),
            'mundo': False,
        }
        d['curto'] = re.sub(r'^(o|a|os|as) ', '', d['nome'])
        fora.append(d)
    inter = cat[cat.index('id="internacionais"'):]
    for d in fora:
        d['mundo'] = ('id="%s"' % d['slug']) in inter
    return fora


def meses(qv):
    mapa = {}
    for m in re.finditer(r'<h2[^>]*>Pra onde viajar em (\w+)</h2>(.*?)(?=<h2|</section>)', qv, re.S):
        mes, bloco = m.group(1), m.group(2)
        for s in re.findall(r'href="/viagens/#([a-z-]+)"', bloco):
            mapa.setdefault(s, []).append(mes)
    return mapa


def posts(blog):
    fora = []
    for m in re.finditer(r'href="/blog/([a-z0-9-]+)/"[^>]*>(.*?)</a>', blog, re.S):
        slug, corpo = m.group(1), m.group(2)
        t = re.search(r'<h[23][^>]*>(.*?)</h[23]>', corpo, re.S)
        if t and not any(p[0] == slug for p in fora):
            fora.append((slug, limpa(t.group(1))))
    return fora


def relacionados(d, ps):
    chave = d['nome'].lower().split(' (')[0]
    alias = {'fernando de noronha': 'noronha', 'lençóis maranhenses': 'lencois', 'foz do iguaçu': 'iguaçu',
             'porto de galinhas': 'porto de galinhas', 'buenos aires': 'buenos aires', 'patagônia': 'patagônia'}
    termo = alias.get(chave, chave)
    fora = [(s, t) for s, t in ps if termo.split()[0] in (s + ' ' + t.lower())]
    return fora[:3]


ICO = ('<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
       'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>')
PIN = ICO % '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
REL = ICO % '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
CAL = ICO % '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'
GRU = ICO % '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'
WAI = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 '
       '11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 '
       '12.04 2zm5.8 14.03c-.25.7-1.44 1.33-2.01 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.93'
       '-4.29-5.08-4.49-.14-.2-1.21-1.61-1.21-3.08s.77-2.18 1.04-2.48c.27-.3.59-.37.79-.37h.57c.18.01.43-.07.67.51.25'
       '.6.84 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.32.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.28 '
       '1.66 2.07 1.14 1.02 2.1 1.34 2.4 1.49.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 '
       '2.01.96.3.15.5.22.57.35.07.12.07.72-.18 1.41z"/></svg>')

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


def pagina(d, cab, rod, meses_d, rel, outros):
    nome = d['nome']
    titulo = '%s: quando ir, quantos dias e o que fazer | OND' % d['curto']
    desc = ('%s Preço sob consulta: o OND cota passagem, hospedagem e passeios com as suas datas.'
            % d['desc'])[:158]
    url = '%s/viagens/%s/' % (SITE, d['slug'])
    foto = SITE + d['foto']
    wa = ('https://wa.me/%s?text=%s' % (WA, 'Ol%C3%A1%2C%20OND%21%20Quero%20uma%20cota%C3%A7%C3%A3o%20de%20viagem%20para%20'
                                        + nome.replace(' ', '%20') + '.%20Vim%20da%20p%C3%A1gina%20do%20destino.'))
    ics = [PIN, REL, CAL, GRU]
    info = ''.join('<li>%s<span>%s</span></li>' % (ics[i] if i < 4 else PIN, html.escape(v))
                   for i, v in enumerate(d['info']))
    hl = ''.join('<li>%s</li>' % html.escape(x) for x in d['destaques'])
    quando = ''
    if meses_d:
        quando = ('<h2>Quando ir para %s</h2><p class="dp-lead">O OND indica %s. Veja o <a class="dp-sec" '
                  'href="/viagens/quando-viajar/">calendário completo por destino</a>.</p>'
                  % (html.escape(nome), ', '.join(meses_d[:-1]) + ' e ' + meses_d[-1] if len(meses_d) > 1 else meses_d[0]))
    posts_html = ''
    if rel:
        posts_html = ('<h2>Para ler antes de ir</h2><ul class="dp-posts">'
                      + ''.join('<li><a href="/blog/%s/">%s</a></li>' % (s, html.escape(t)) for s, t in rel)
                      + '</ul>')
    ld = {
        '@context': 'https://schema.org', '@type': 'TouristDestination', 'name': d['curto'], 'url': url,
        'description': d['desc'], 'image': foto,
        'containedInPlace': {'@type': 'Place', 'name': d['info'][0] if d['info'] else nome},
        'includesAttraction': [{'@type': 'TouristAttraction', 'name': x} for x in d['destaques']],
        'isPartOf': {'@type': 'CollectionPage', 'url': SITE + '/viagens/'},
    }
    trilha = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Início', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Viagens', 'item': SITE + '/viagens/'},
        {'@type': 'ListItem', 'position': 3, 'name': d['curto'], 'item': url}]}
    return f"""<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0d0d14">
<title>{html.escape(titulo)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" type="image/svg+xml" href="/assets/ond-symbol.svg">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="OND">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="{url}">
<meta property="og:title" content="Viaje para {html.escape(nome)} com o OND">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{foto}">
<meta property="og:image:alt" content="{html.escape(d['alt'])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Viaje para {html.escape(nome)} com o OND">
<meta name="twitter:description" content="{html.escape(desc)}">
<meta name="twitter:image" content="{foto}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/tokens/ond-core.css">
<link rel="stylesheet" href="/tokens/ond-b2c.css">
<link rel="stylesheet" href="/assets/site-base.css">
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
<main class="dp" id="conteudo">
  <div class="dp-in">
    <nav class="dp-bc" aria-label="Você está em"><a href="/">Início</a> · <a href="/viagens/">Viagens</a> · {html.escape(d['curto'])}</nav>
    <div class="dp-capa"><picture><source srcset="{d['foto'].replace('.jpg', '.webp')}" type="image/webp"><img src="{d['foto']}" alt="{html.escape(d['alt'])}" width="1200" height="514" fetchpriority="high"></picture></div>
    <h1>Viaje para {html.escape(nome)}</h1>
    <div class="dp-sob">Preço sob consulta</div>
    <p class="dp-lead">{html.escape(d['desc'])}</p>
    <ul class="dp-info">{info}</ul>
    <div class="dp-cta">
      <a class="dp-wa" href="{wa}" target="_blank" rel="noopener" data-wa="destino: {html.escape(nome)}">{WAI}Quero essa viagem</a>
      <a class="dp-sec" href="/viagens/">Ver todos os destinos</a>
    </div>
    <h2>O que entra na viagem</h2>
    <ul class="dp-hl">{hl}</ul>
    {'<p class="dp-nota">' + html.escape(d['nota']) + '</p>' if d['nota'] else ''}
    {quando}
    <h2>Como o OND monta essa viagem</h2>
    <p class="dp-lead">Você conta as suas datas e a cidade de saída, e uma pessoa do OND cota passagem, hospedagem e passeios numa proposta só. A emissão sai na companhia aérea e no hotel, com localizador no seu nome, e o suporte continua durante a viagem.</p>
    {posts_html}
    <h2>Outros destinos</h2>
    <ul class="dp-outros">{outros}</ul>
  </div>
</main>
<script src="/assets/a11y.js" defer></script>
{rod}
</body>
</html>
"""


def main():
    cat = ler('viagens/index.html')
    qv = ler('viagens/quando-viajar/index.html')
    blog = ler('blog.html')
    ds = fichas(cat)
    ms = meses(qv)
    ps = posts(blog)
    cab = (re.search(r'<!-- HEADER -->.*?</header>', cat, re.S).group(0) + '\n'
           + re.search(r'<nav class="mobile-nav".*?</nav>', cat, re.S).group(0) + '\n')
    rod = re.search(r'<!-- FOOTER -->.*?</footer>', cat, re.S).group(0) + '\n'
    cab = cab.replace('class="nav-active"', '').replace('href="/viagens/" >Viagens', 'href="/viagens/">Viagens')
    for d in ds:
        vizinhos = [x for x in ds if x['mundo'] == d['mundo'] and x['slug'] != d['slug']][:8]
        outros = ''.join('<li><a href="/viagens/%s/">%s</a></li>' % (v['slug'], html.escape(v['curto'])) for v in vizinhos)
        pag = pagina(d, cab, rod, ms.get(d['slug'], []), relacionados(d, ps), outros)
        dest = os.path.join(ROOT, 'viagens', d['slug'])
        os.makedirs(dest, exist_ok=True)
        with open(os.path.join(dest, 'index.html'), 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(pag)
    print('%d páginas de destino geradas' % len(ds))
    sem_post = [d['slug'] for d in ds if not relacionados(d, ps)]
    print('sem post relacionado:', len(sem_post), sem_post[:8])


if __name__ == '__main__':
    main()
