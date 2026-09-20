#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-busca.py: monta o índice da busca interna (assets/busca.json) e a página /busca/.

Junta num só índice os destinos (viagens/<slug>/), os posts do blog e as páginas fixas.
A busca roda no navegador, sem servidor: a página baixa o JSON e filtra por texto.

Rode depois de build-destinos.py e build-blog.py:  python build-busca.py
"""
import os, re, json, glob, html, unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))


def limpa(t):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', t)).strip()


def sem_acento(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t.lower()) if unicodedata.category(c) != 'Mn')


def meta(p, nome):
    m = re.search(r'<meta name="%s" content="([^"]*)"' % nome, p)
    return html.unescape(m.group(1)) if m else ''


def indice():
    itens = []
    for d in sorted(glob.glob(os.path.join(ROOT, 'viagens', '*', 'index.html'))):
        slug = os.path.basename(os.path.dirname(d))
        if slug == 'quando-viajar':
            continue
        s = open(d, encoding='utf8').read()
        h1 = limpa(re.search(r'<h1>(.*?)</h1>', s, re.S).group(1))
        info = [limpa(x) for x in re.findall(r'<li>.*?<span>(.*?)</span></li>', s, re.S)][:4]
        itens.append({'t': h1, 'u': '/viagens/%s/' % slug, 'k': 'Destino',
                      'd': meta(s, 'description')[:150], 'x': ' '.join(info)})
    blog = open(os.path.join(ROOT, 'blog.html'), encoding='utf8').read()
    vistos = set()
    for m in re.finditer(r'href="/blog/([a-z0-9-]+)/"', blog):
        slug = m.group(1)
        if slug in vistos:
            continue
        vistos.add(slug)
        p = os.path.join(ROOT, 'blog', slug, 'index.html')
        if not os.path.exists(p):
            continue
        s = open(p, encoding='utf8').read()
        itens.append({'t': limpa(re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S).group(1)),
                      'u': '/blog/%s/' % slug, 'k': 'Blog', 'd': meta(s, 'description')[:150], 'x': ''})
    fixas = [('/viagens/', 'Catálogo de viagens', 'Todos os destinos que o OND vende, do Brasil e do mundo.'),
             ('/viagens/quando-viajar/', 'Quando viajar: o melhor mês para cada destino', 'Calendário de viagem mês a mês.'),
             ('/blog.html', 'Blog do OND', 'Destinos, quanto custa, quando ir e dicas de viagem.'),
             ('/agencias.html', 'OND para agências de viagem', 'A ferramenta do OND para agências venderem mais.'),
             ('/', 'OND, agência de viagens', 'Passagens, hospedagem e passeios com suporte humano.')]
    for u, t, d in fixas:
        itens.append({'t': t, 'u': u, 'k': 'Página', 'd': d, 'x': ''})
    for i in itens:
        i['b'] = sem_acento(' '.join([i['t'], i['d'], i['x']]))
    return itens


PAG = """<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0d0d14">
<title>Buscar no site | OND</title>
<meta name="description" content="Busque destinos, posts e páginas do OND: para onde viajar, quanto custa, quando ir e como comprar a viagem.">
<meta name="robots" content="noindex,follow">
<link rel="icon" type="image/svg+xml" href="/assets/ond-symbol.svg">
<link rel="canonical" href="https://ondviajar.com.br/busca/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/tokens/ond-core.css">
<link rel="stylesheet" href="/tokens/ond-b2c.css">
<link rel="stylesheet" href="/assets/site-base.css">
<script>try{if(localStorage.getItem('ond_theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}</script>
<style id="a11y-base">:root{color-scheme:dark}[data-theme="light"]{color-scheme:light}a,button,summary{touch-action:manipulation}.skip{position:absolute;left:12px;top:-60px;z-index:100000;background:var(--purple,#7f11f4);color:#fff;padding:10px 16px;border-radius:10px;font-weight:700;text-decoration:none;transition:top .2s}.skip:focus{top:12px}</style>
<style id="busca-css">
.bs{max-width:820px;margin:0 auto;padding:40px 24px 70px}
.bs h1{font-size:clamp(1.9rem,4vw,2.8rem);letter-spacing:-.03em;line-height:1.05}
.bs-form{display:flex;gap:10px;margin-top:22px}
.bs-form input{flex:1;min-width:0;font:inherit;font-size:1.02rem;color:var(--text);background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;outline:none}
.bs-form input:focus-visible{border-color:var(--purple);box-shadow:0 0 0 3px color-mix(in srgb,var(--purple) 35%,transparent)}
.bs-cont{color:var(--muted);font-size:.92rem;margin-top:18px}
.bs-l{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:10px}
.bs-l a{display:block;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px 18px;text-decoration:none;color:var(--text);transition:border-color .2s}
.bs-l a:hover{border-color:var(--purple)}
.bs-k{font-size:.72rem;font-weight:700;color:var(--purple-light);display:block;margin-bottom:4px}
.bs-t{display:block;font-weight:700;line-height:1.3}
.bs-d{display:block;color:var(--muted);font-size:.9rem;line-height:1.5;margin-top:4px}
.bs-vazio{color:var(--muted);line-height:1.6}
.bs-vazio a{color:var(--purple-light)}
</style>
<script src="/assets/ond-logo.js" defer></script>
</head>
<body>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
__CAB__
<main class="bs" id="conteudo">
  <h1>Buscar no site</h1>
  <form class="bs-form" role="search" onsubmit="return false">
    <label class="skip" for="bs-q">O que você procura</label>
    <input id="bs-q" type="search" name="q" placeholder="Destino, mês, quanto custa…" autocomplete="off" autofocus>
  </form>
  <p class="bs-cont" aria-live="polite"></p>
  <ul class="bs-l"></ul>
</main>
<script>
(function(){
  var campo=document.getElementById('bs-q'), lista=document.querySelector('.bs-l'), cont=document.querySelector('.bs-cont'), dados=[];
  function sem(t){ return t.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'') }
  function mostra(q){
    var termos=sem(q).split(/\\s+/).filter(Boolean);
    if(!termos.length){ lista.innerHTML=''; cont.textContent='Digite para buscar entre ' + dados.length + ' páginas.'; return }
    var achados=dados.filter(function(i){ return termos.every(function(t){ return i.b.indexOf(t)>=0 }) }).slice(0,30);
    cont.textContent = achados.length ? achados.length + (achados.length===1?' resultado':' resultados') : '';
    lista.innerHTML = achados.length
      ? achados.map(function(i){ return '<li><a href="'+i.u+'"><span class="bs-k">'+i.k+'</span><span class="bs-t">'+i.t+'</span><span class="bs-d">'+(i.d||'')+'</span></a></li>' }).join('')
      : '<li class="bs-vazio">Nada com esse termo. Tente o nome do destino, ou <a href="https://wa.me/5511943615412?text=Ol%C3%A1%2C%20OND%21%20Estou%20procurando%20uma%20viagem." target="_blank" rel="noopener">pergunte pro OND no WhatsApp</a>.</li>';
  }
  fetch('/assets/busca.json').then(function(r){ return r.json() }).then(function(j){
    dados=j; var q=new URLSearchParams(location.search).get('q')||''; campo.value=q; mostra(q);
    campo.addEventListener('input',function(){ mostra(campo.value);
      var u=new URL(location); campo.value?u.searchParams.set('q',campo.value):u.searchParams.delete('q'); history.replaceState(null,'',u); });
  });
})();
</script>
<script src="/assets/a11y.js" defer></script>
__ROD__
</body>
</html>
"""


def main():
    itens = indice()
    with open(os.path.join(ROOT, 'assets', 'busca.json'), 'w', encoding='utf8', newline='\n') as fh:
        json.dump(itens, fh, ensure_ascii=False, separators=(',', ':'))
    cat = open(os.path.join(ROOT, 'viagens', 'index.html'), encoding='utf8').read().replace('\r\n', '\n')
    cab = (re.search(r'<!-- HEADER -->.*?</header>', cat, re.S).group(0) + '\n'
           + re.search(r'<nav class="mobile-nav".*?</nav>', cat, re.S).group(0))
    rod = re.search(r'<!-- FOOTER -->.*?</footer>', cat, re.S).group(0)
    os.makedirs(os.path.join(ROOT, 'busca'), exist_ok=True)
    with open(os.path.join(ROOT, 'busca', 'index.html'), 'w', encoding='utf8', newline='\n') as fh:
        fh.write(PAG.replace('__CAB__', cab).replace('__ROD__', rod))
    print('busca: %d itens no índice' % len(itens))


if __name__ == '__main__':
    main()
