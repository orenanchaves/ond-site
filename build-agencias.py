#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-agencias.py: gera /agencias/planos/ a partir dos planos que já existem em agencias.html.

Cada plano ganha âncora própria e um botão que leva ao fluxo de contratação da página principal
(/agencias.html?plano=CODIGO#planos), que é onde o checkout roda.

O topo e o rodapé são os mesmos de agencias.html, com o CSS em assets/agencias-base.css.

Rode depois de mexer nos planos:  python build-agencias.py
"""
import os, re, json, html

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://ondviajar.com.br'


def limpa(t):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t)).strip()


def planos(s):
    i = s.find('id="planos"')
    bloco = s[i:s.find('</section>', i)]
    fora = []
    for m in re.finditer(r'<div class="plan(?: [^"]*)?">(.*?)(?=<div class="plan(?: [^"]*)?">|<div class="plan-custom)', bloco, re.S):
        b = m.group(1)
        nome = re.search(r'class="plan-name"[^>]*>(.*?)<', b, re.S)
        para = re.search(r'class="plan-for"[^>]*>(.*?)</div>', b, re.S)
        cod = re.search(r'data-plan="([^"]+)"', b)
        if not (nome and cod):
            continue
        fora.append({
            'nome': limpa(nome.group(1)),
            'para': limpa(para.group(1)) if para else '',
            'codigo': cod.group(1),
            'itens': [limpa(x) for x in re.findall(r'<li[^>]*>(.*?)</li>', b, re.S)],
            'destaque': 'featured' in m.group(0)[:120] or 'plan-tag rec' in b,
        })
    return fora


def arruma_links(t):
    """O topo e o rodapé de agencias.html usam caminhos relativos e âncoras da própria página."""
    t = t.replace('<a href="index.html" class="header-logo">', '<a href="/agencias.html" class="header-logo">')
    t = t.replace('href="index.html" class="nav-home"', 'href="/" class="nav-home"')
    t = t.replace('href="index.html" class="footer-home"', 'href="/" class="footer-home"')
    for a in ('planos', 'plataforma', 'quem-somos'):
        t = t.replace('href="#%s"' % a, 'href="/agencias.html#%s"' % a)
    t = t.replace('href="agencias-app.html"', 'href="/agencias-app.html"')
    t = t.replace('href="index.html"', 'href="/"')
    t = t.replace('href="agencias.html"', 'href="/agencias.html"')
    t = t.replace('class="header-cta">Ver planos<', 'class="header-cta">Contratar o OND<')
    return t


CSS = """<style id="pl-css">
body{background:var(--bg);color:var(--text);font-family:var(--ond-font-family-base);line-height:1.6}
.pl{padding-bottom:80px}
.pl-in{max-width:1120px;margin:0 auto;padding:0 24px}
.pl-bc{font-size:.85rem;color:var(--muted);padding:26px 0 8px}
.pl-bc a{color:inherit;text-decoration:none}.pl-bc a:hover{text-decoration:underline}
.pl h1{font-size:clamp(2rem,4.2vw,3rem);line-height:1.06;letter-spacing:-.03em;margin:10px 0 0}
.pl-lead{font-size:1.08rem;line-height:1.6;color:var(--muted);max-width:62ch;margin-top:14px}
.pl-aviso{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px 18px;margin-top:22px;max-width:760px;line-height:1.55;color:var(--muted)}
.pl-aviso b{display:block;color:var(--text);margin-bottom:2px}
.pl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-top:34px}
.pl-card{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:22px;scroll-margin-top:100px}
.pl-card.top{border-color:var(--blue);box-shadow:0 12px 32px var(--blue-glow)}
.pl-tag{align-self:flex-start;font-size:.72rem;font-weight:700;color:#fff;background:var(--blue);border-radius:50px;padding:4px 11px;margin-bottom:10px}
.pl-nome{font-size:1.25rem;font-weight:800;letter-spacing:-.01em;color:var(--text)}
.pl-para{color:var(--muted);line-height:1.5;margin-top:6px;font-size:.95rem}
.pl-itens{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:9px}
.pl-itens li{display:flex;gap:9px;align-items:flex-start;font-size:.92rem;line-height:1.45;color:var(--text)}
.pl-itens li::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--blue);flex:none;margin-top:7px}
.pl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--blue);color:#fff;font-weight:700;padding:12px 18px;border-radius:50px;text-decoration:none;margin-top:20px}
.pl-card .pl-btn{margin-top:auto}
.pl-btn:hover{background:var(--blue-light)}
.pl-btn.vazio{background:transparent;color:var(--text);border:1px solid var(--border)}
.pl-btn.vazio:hover{border-color:var(--blue);background:transparent}
.pl-fim{display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-top:34px}
.pl-sec{color:var(--muted);font-weight:600;text-decoration:underline;text-underline-offset:3px}
.pl-sec:hover{color:var(--text)}
.pl h2{font-size:clamp(1.3rem,2.4vw,1.8rem);letter-spacing:-.02em;margin:54px 0 12px}
.pl-prova{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;list-style:none;padding:0;margin:22px 0 0}
.pl-prova a{display:block;height:100%;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;text-decoration:none;color:var(--text);font-weight:700;line-height:1.35;transition:border-color .2s,transform .2s}
.pl-prova a:hover{border-color:var(--blue);transform:translateY(-2px)}
.pl-prova small{display:block;font-weight:500;color:var(--muted);margin-top:6px;line-height:1.45}
.pl a:focus-visible,.pl button:focus-visible{outline:3px solid var(--blue-light);outline-offset:3px}
@media(max-width:700px){.pl-in{padding:0 18px}.pl-grid{grid-template-columns:1fr}}
</style>"""

CHROME_JS = """<script>
function toggleMenu(){var n=document.getElementById('mobileNav');if(n)n.classList.toggle('open')}
function closeMenu(){var n=document.getElementById('mobileNav');if(n)n.classList.remove('open')}
function toggleTheme(){var d=document.documentElement,claro=d.getAttribute('data-theme')==='light';
  d.setAttribute('data-theme',claro?'dark':'light');try{localStorage.setItem('ond_theme',claro?'dark':'light')}catch(e){}}
try{if(localStorage.getItem('ond_theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}
</script>"""


def pagina(ps, cab, rod):
    url = SITE + '/agencias/planos/'
    cards = ''
    for p in ps:
        slug = p['codigo'].lower()
        itens = ''.join('<li>%s</li>' % html.escape(x) for x in p['itens'])
        cards += (
            '<div class="pl-card%s" id="%s">' % (' top' if p['destaque'] else '', slug)
            + ('<span class="pl-tag">Mais procurado</span>' if p['destaque'] else '')
            + '<div class="pl-nome">%s</div>' % html.escape(p['nome'])
            + '<p class="pl-para">%s</p>' % html.escape(p['para'])
            + '<ul class="pl-itens">%s</ul>' % itens
            + '<a class="pl-btn" href="/agencias.html?plano=%s#planos">Contratar o OND</a></div>' % p['codigo'])
    cards += ('<div class="pl-card" id="personalizado"><div class="pl-nome">OND Personalizado</div>'
              '<p class="pl-para">Para rede de agências, operação com várias lojas ou necessidade fora dos planos.</p>'
              '<ul class="pl-itens"><li>Escopo definido junto com a sua operação</li>'
              '<li>Conversa antes de qualquer proposta</li></ul>'
              '<a class="pl-btn vazio" href="https://calendly.com/renanfr1047/30min" target="_blank" rel="noopener">Agendar reunião</a></div>')

    ld = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'OND para agências', 'item': SITE + '/agencias.html'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Planos', 'item': url}]}
    return f"""<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#060a14">
<title>Planos do OND para agências de viagem</title>
<meta name="description" content="Os planos do OND para agências: o que cada um inclui, para que tipo de operação serve e como contratar. O valor aparece na contratação, antes do pagamento.">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" type="image/svg+xml" href="/assets/ond-symbol.svg">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="OND">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="{url}">
<meta property="og:title" content="Planos do OND para agências de viagem">
<meta property="og:description" content="O que cada plano inclui e para que tipo de agência serve.">
<meta property="og:image" content="{SITE}/assets/og-agencias.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/tokens/ond-core.css">
<link rel="stylesheet" href="/tokens/ond-b2b.css">
<link rel="stylesheet" href="/assets/agencias-base.css">
<link rel="stylesheet" href="/assets/acessibilidade.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<style id="a11y-base">html{{scroll-padding-top:100px}}a,button,summary{{touch-action:manipulation}}.skip{{position:absolute;left:12px;top:-60px;z-index:100000;background:var(--blue);color:#fff;padding:10px 16px;border-radius:10px;font-weight:700;text-decoration:none;transition:top .2s}}.skip:focus{{top:12px}}</style>
{CSS}
{CHROME_JS}
<script src="/assets/ond-logo.js" defer></script>
</head>
<body>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
{cab}
<main class="pl" id="conteudo">
  <div class="pl-in">
    <nav class="pl-bc" aria-label="Você está em"><a href="/agencias.html">OND para agências</a> · Planos</nav>
    <h1>Planos do OND para agências</h1>
    <p class="pl-lead">Cada plano muda o volume de contatos de viajante que chegam para a sua agência e o compromisso de prazo. O que não muda: o lead vem com destino, datas e orçamento, e a conversa acontece no seu WhatsApp.</p>
    <div class="pl-aviso"><b>Sobre o valor</b>O preço de cada plano aparece na hora de contratar, antes de qualquer pagamento. Se preferir ver tudo antes, agende uma conversa de 30 minutos.</div>
    <div class="pl-grid">{cards}</div>
    <div class="pl-fim">
      <a class="pl-btn" href="/agencias.html#planos">Contratar o OND</a>
      <a class="pl-sec" href="https://calendly.com/renanfr1047/30min" target="_blank" rel="noopener">Agendar reunião</a>
    </div>
    <h2>Veja o produto funcionando</h2>
    <p class="pl-lead">O mesmo catálogo e o mesmo conteúdo que atraem o viajante são o que a sua agência passa a vender.</p>
    <ul class="pl-prova">
      <li><a href="/viagens/">Catálogo de viagens<small>25 destinos com época, duração e perfil</small></a></li>
      <li><a href="/viagens/quando-viajar/">Quando viajar<small>Calendário mês a mês por destino</small></a></li>
      <li><a href="/blog.html">Blog<small>Quanto custa, quando ir e o que levar</small></a></li>
    </ul>
  </div>
</main>
{rod}
<script src="/assets/a11y.js" defer></script>
<script src="/assets/busca.js" defer></script>
</body>
</html>
"""


def main():
    s = open(os.path.join(ROOT, 'agencias.html'), encoding='utf8').read().replace('\r\n', '\n')
    ps = planos(s)
    cab = re.search(r'<header class="header">.*?</header>', s, re.S).group(0)
    mob = re.search(r'<nav class="mobile-nav".*?</nav>', s, re.S)
    if mob:
        cab += '\n' + mob.group(0)
    rod = re.search(r'<footer.*?</footer>', s, re.S).group(0)
    cab, rod = arruma_links(cab), arruma_links(rod)
    os.makedirs(os.path.join(ROOT, 'agencias', 'planos'), exist_ok=True)
    with open(os.path.join(ROOT, 'agencias', 'planos', 'index.html'), 'w', encoding='utf8', newline='\n') as fh:
        fh.write(pagina(ps, cab, rod))
    print('/agencias/planos/ com %d planos: %s' % (len(ps), ', '.join(p['nome'] for p in ps)))


if __name__ == '__main__':
    main()
