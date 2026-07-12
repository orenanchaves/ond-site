#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build-blog.py — gera os posts do blog do OND a partir da API do OND Firma.

- Puxa https://ond-firma.ond-jarvis.workers.dev/api/blog/posts
- Para cada post: baixa a capa, gera /blog/<slug>/index.html (a partir do
  post-modelo.html como template), com meta/OG/Twitter, FAQ + schema FAQPage.
- Regenera os cards e as categorias do blog.html apontando pros posts reais.

Rode de novo sempre que o conteúdo mudar:  python build-blog.py
"""
import json, re, html, os, urllib.request

API  = 'https://ond-firma.ond-jarvis.workers.dev/api/blog/posts'
ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://ondviajar.com.br'

ANCORA_CAT   = {'Produto':'ia','Economia':'orcamento','Verão Europa':'orcamento','Guia':'dicas','Destino':'roteiros'}
CAT_LABEL    = {'roteiros':'Roteiros','dicas':'Dicas','orcamento':'Orçamento','ia':'IA & Viagem','destinos':'Destinos'}
CAT_TAGCLASS = {'roteiros':'tag-pink','dicas':'tag-blue','orcamento':'tag-orange','ia':'tag-green','destinos':'tag-purple'}
CAT_ORDER    = ['roteiros','dicas','orcamento','ia','destinos']
MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

# Capas trocadas manualmente por imagens mais emblemáticas do destino (a da API não era).
COVER_OVERRIDE = {
    'roteiro-buenos-aires': {
        'url':'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200&q=72&auto=format',
        'alt':'Fachadas coloridas do Caminito, no bairro da Boca, em Buenos Aires',
        'credit':'Unsplash'},
    'roteiro-lisboa': {
        'url':'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&q=72&auto=format',
        'alt':'O icônico elétrico amarelo 28 numa rua histórica de Lisboa',
        'credit':'Unsplash'},
}

EXTRA_CSS = ('\n.prose ol{margin:0 0 22px 0;padding-left:22px;color:#cfcce8}'
 '\n[data-theme="light"] .prose ol{color:#2a2540}'
 '\n.prose .tldr{font-style:normal;border-left-color:var(--green);background:var(--green-dim)}'
 '\n.prose .tldr strong{color:var(--green)}'
 '\n.art-cover-credit{font-size:.72rem;color:var(--muted2);margin:-22px 0 30px;text-align:center}'
 '\n.faq{margin:50px 0 0}'
 '\n.faq h2{font-size:1.72rem;font-weight:800;letter-spacing:-.02em;margin-bottom:18px}'
 '\n.faq-item{border:1px solid var(--border);border-radius:14px;padding:16px 20px;margin-bottom:12px;background:var(--card)}'
 '\n.faq-item h3{font-size:1.1rem;font-weight:700;margin-bottom:8px;color:var(--text)}'
 '\n.faq-item p{font-size:1rem;color:var(--muted);line-height:1.75;margin:0}\n')

def esc(s): return html.escape(s or '', quote=True)
def cslug(s): return re.sub(r'^blog-', '', s)
def fmt_date(iso):
    try:
        y,m,d = iso.split('-'); return f'{int(d)} {MESES[int(m)-1]} {y}'
    except Exception:
        return '2026'
def reading_min(h):
    return max(3, round(len(re.sub(r'<[^>]+>',' ',h).split())/200))
def excerpt(h, n=155):
    m = re.search(r'<p>(.*?)</p>', h, re.S)
    t = re.sub(r'\s+',' ', re.sub(r'<[^>]+>','', m.group(1) if m else h)).strip()
    return (t[:n].rsplit(' ',1)[0]+'…') if len(t) > n else t

def absolutize(s):
    for rel in ['index.html','blog.html','assessoria.html','agencias.html','post-modelo.html']:
        s = s.replace('href="'+rel, 'href="/'+rel)
    s = s.replace('src="assets/','src="/assets/').replace('href="assets/','href="/assets/')
    s = s.replace('src="tokens/','src="/tokens/').replace('href="tokens/','href="/tokens/')
    return s

def download_cover(cs, url):
    """Baixa a capa pra /assets/blog/<slug>.jpg. Retorna caminho local ou a URL externa."""
    dest_dir = os.path.join(ROOT,'assets','blog')
    os.makedirs(dest_dir, exist_ok=True)
    path = os.path.join(dest_dir, cs+'.jpg')
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=25).read()
        if len(data) < 3000 or not (data[:2]==b'\xff\xd8' or data[:8]==b'\x89PNG\r\n\x1a\n'):
            raise ValueError('não parece imagem (%d bytes)' % len(data))
        open(path,'wb').write(data)
        return '/assets/blog/'+cs+'.jpg'
    except Exception as e:
        print('    ! capa falhou (%s), usando URL externa' % e)
        return url

def rep(pattern, value, s):
    return re.sub(pattern, lambda m: m.group(1)+value+m.group(2), s, count=1)

def build_head(head_open, p, cs, cover, cat):
    s = head_open
    title, desc, kw = p['title'], p['metaDescription'], p.get('keywords','')
    canon = f'{SITE}/blog/{cs}/'
    ogimg = cover if cover.startswith('http') else SITE+cover
    s = re.sub(r'<title>.*?</title>', lambda m: f'<title>{esc(title)} — Vai para onde?</title>', s, count=1, flags=re.S)
    s = rep(r'(<meta name="description" content=")[^"]*(">)', esc(desc), s)
    if 'name="keywords"' in s:
        s = rep(r'(<meta name="keywords" content=")[^"]*(">)', esc(kw), s)
    else:
        s = s.replace('<meta name="description"', f'<meta name="keywords" content="{esc(kw)}">\n<meta name="description"', 1)
    s = rep(r'(<link rel="canonical" href=")[^"]*(">)', canon, s)
    s = rep(r'(<meta property="og:url" content=")[^"]*(">)', canon, s)
    s = rep(r'(<meta property="og:title" content=")[^"]*(">)', esc(title), s)
    s = rep(r'(<meta property="og:description" content=")[^"]*(">)', esc(desc), s)
    s = rep(r'(<meta property="og:image" content=")[^"]*(">)', esc(ogimg), s)
    s = rep(r'(<meta property="og:image:alt" content=")[^"]*(">)', esc(p.get('coverAlt','')), s)
    s = rep(r'(<meta property="article:published_time" content=")[^"]*(">)', (p.get('updatedAt') or '2026-07-10'), s)
    s = rep(r'(<meta property="article:section" content=")[^"]*(">)', esc(CAT_LABEL.get(cat,cat)), s)
    s = rep(r'(<meta name="twitter:title" content=")[^"]*(">)', esc(title), s)
    s = rep(r'(<meta name="twitter:description" content=")[^"]*(">)', esc(desc), s)
    s = rep(r'(<meta name="twitter:image" content=")[^"]*(">)', esc(ogimg), s)
    s = s.replace('</style>', EXTRA_CSS+'</style>', 1)
    faqs = p.get('faq') or []
    if faqs:
        schema = {'@context':'https://schema.org','@type':'FAQPage','mainEntity':[
            {'@type':'Question','name':f['q'],'acceptedAnswer':{'@type':'Answer','text':f['a']}} for f in faqs]}
        s = s.replace('</head>', '<script type="application/ld+json">'+json.dumps(schema, ensure_ascii=False)+'</script>\n</head>', 1)
    return s

def build_article(p, cs, cover, cat):
    tag  = CAT_LABEL.get(cat, cat)
    date = fmt_date(p.get('updatedAt',''))
    rmin = reading_min(p['html'])
    credit = p.get('coverCredit','')
    credit_html = f'\n  <p class="art-cover-credit">Foto: {esc(credit)}</p>' if credit else ''
    faqs = p.get('faq') or []
    faq_html = ''
    if faqs:
        items = '\n  '.join(f'<div class="faq-item"><h3>{esc(f["q"])}</h3><p>{esc(f["a"])}</p></div>' for f in faqs)
        faq_html = f'\n  <section class="faq">\n  <h2>Perguntas frequentes</h2>\n  {items}\n  </section>\n'
    prose = absolutize(p['html'])
    return (f'<article class="article">\n'
      f'  <div class="breadcrumb"><a href="/blog.html">← Vai para onde?</a> · {esc(tag)}</div>\n'
      f'  <span class="art-tag">{esc(tag)}</span>\n'
      f'  <h1 class="art-title">{esc(p["title"])}</h1>\n'
      f'  <div class="art-meta">\n'
      f'    <img class="au-avatar" src="/assets/ondino.png" alt="Ondino, personagem do OND">\n'
      f'    <span>Por <strong style="color:var(--text)">Ondino</strong></span>\n'
      f'    <span class="dot"></span><span>{date}</span>\n'
      f'    <span class="dot"></span><span>{rmin} min de leitura</span>\n'
      f'  </div>\n'
      f'  <div class="art-cover"><img src="{esc(cover)}" alt="{esc(p.get("coverAlt",""))}" loading="eager"></div>{credit_html}\n'
      f'  <div class="prose">\n{prose}\n  </div>\n{faq_html}'
      f'  <div class="art-cta">\n'
      f'    <h3>Pronto pra tirar do papel?</h3>\n'
      f'    <p>Conte pro OND vAI pra onde quer ir e ele monta o roteiro completo — com voos, hotéis e passeios — em minutos.</p>\n'
      f'    <a href="https://web.ondviajar.com.br/" onclick="if(window.openApp){{openApp(event)}}" class="btn-primary" target="_blank" rel="noopener">Planejar minha viagem grátis →</a>\n'
      f'  </div>\n'
      f'  <div class="author-card">\n'
      f'    <img src="/assets/ondino.png" alt="Ondino, o personagem viajante do OND">\n'
      f'    <div><div class="au-name">Ondino 🤠</div>\n'
      f'    <div class="au-bio">O viajante de chapéu do OND. Já perdeu voo, dormiu em aeroporto e aprendeu na marra — hoje usa o OND vAI pra planejar tudo em minutos e divide aqui os melhores destinos e dicas.</div></div>\n'
      f'  </div>\n'
      f'  <a href="/blog.html" class="back-blog">← Voltar para o blog</a>\n'
      f'</article>')

def card(p, cs, cover, cat, featured=False):
    tag = CAT_LABEL.get(cat,cat); tc = CAT_TAGCLASS.get(cat,'tag-purple')
    date = fmt_date(p.get('updatedAt','')); rmin = reading_min(p['html']); ex = excerpt(p['html'])
    href = f'/blog/{cs}/'; alt = esc(p.get('coverAlt',''))
    if featured:
        return (f'<a href="{href}" class="featured" data-cat="{cat}">\n'
          f'    <div class="featured-thumb"><img src="{esc(cover)}" alt="{alt}" loading="lazy"></div>\n'
          f'    <div class="featured-body">\n'
          f'      <span class="post-tag {tc}">{esc(tag)}</span>\n'
          f'      <h2 class="featured-title">{esc(p["title"])}</h2>\n'
          f'      <p class="featured-excerpt">{esc(ex)}</p>\n'
          f'      <div class="post-meta"><span>Ondino</span><span class="dot"></span><span>{date}</span><span class="dot"></span><span>{rmin} min de leitura</span></div>\n'
          f'    </div>\n  </a>')
    return (f'<a href="{href}" class="post-card" data-cat="{cat}">\n'
      f'      <div class="post-thumb"><img src="{esc(cover)}" alt="{alt}" loading="lazy"></div>\n'
      f'      <div class="post-body">\n'
      f'        <span class="post-tag {tc}">{esc(tag)}</span>\n'
      f'        <h3 class="post-title">{esc(p["title"])}</h3>\n'
      f'        <p class="post-excerpt">{esc(ex)}</p>\n'
      f'        <div class="post-meta"><span>{date}</span><span class="dot"></span><span>{rmin} min</span></div>\n'
      f'      </div>\n    </a>')

def main():
    print('Puxando API...')
    req = urllib.request.Request(API, headers={'User-Agent':'Mozilla/5.0','Accept':'application/json'})
    data = json.load(urllib.request.urlopen(req, timeout=30))
    posts = data['posts']
    print(f'  {len(posts)} posts')
    tpl = open(os.path.join(ROOT,'post-modelo.html'), encoding='utf-8').read()
    head_open = absolutize(tpl[:tpl.index('<article')])
    tail      = absolutize(tpl[tpl.index('</article>')+len('</article>'):])

    meta = []  # (post, cs, cover, cat)
    for p in posts:
        cs  = cslug(p['slug'])
        cat = ANCORA_CAT.get(p.get('ancora'), 'dicas')
        ov = COVER_OVERRIDE.get(cs)
        if ov:
            p['cover'], p['coverAlt'], p['coverCredit'] = ov['url'], ov['alt'], ov['credit']
        print(f'- {cs}  [{cat}]' + ('  (capa override)' if ov else ''))
        cover = download_cover(cs, p.get('cover',''))
        meta.append((p, cs, cover, cat))
        page = build_head(head_open, p, cs, cover, cat) + build_article(p, cs, cover, cat) + tail
        d = os.path.join(ROOT,'blog',cs); os.makedirs(d, exist_ok=True)
        open(os.path.join(d,'index.html'),'w',encoding='utf-8',newline='\n').write(page)

    # --- regenera blog.html (chips + cards) ---
    blog = open(os.path.join(ROOT,'blog.html'), encoding='utf-8').read()
    present = [c for c in CAT_ORDER if any(m[3]==c for m in meta)]
    chips = ['<button class="cat-chip active" onclick="filterCat(this,\'todos\')">Todos</button>']
    chips += [f'<button class="cat-chip" onclick="filterCat(this,\'{c}\')">{CAT_LABEL[c].replace("&","&amp;")}</button>' for c in present]
    NEW_CHIPS = '<div class="blog-cats">\n  ' + '\n  '.join(chips) + '\n</div>'
    i = blog.index('<div class="blog-cats">'); j = blog.index('</div>', i)+len('</div>')
    blog = blog[:i] + NEW_CHIPS + blog[j:]

    feat = card(*meta[0], featured=True)
    grid = '\n\n    '.join(card(*m) for m in meta[1:])
    NEW_CARDS = ('<!-- FEATURED -->\n  <p class="section-label">Em destaque</p>\n  ' + feat +
      '\n\n  <!-- GRID -->\n  <p class="section-label">Últimas histórias</p>\n  <div class="blog-grid" id="grid">\n\n    '
      + grid + '\n\n  </div>\n\n  ')
    i = blog.index('<!-- FEATURED -->'); j = blog.index('<p class="empty" id="empty">')
    blog = blog[:i] + NEW_CARDS + blog[j:]
    open(os.path.join(ROOT,'blog.html'),'w',encoding='utf-8',newline='\n').write(blog)
    print('blog.html atualizado (%d cards, chips: %s)' % (len(meta), ', '.join(present)))
    print('OK')

if __name__ == '__main__':
    main()
