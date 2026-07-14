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
import json, re, html, os, datetime, urllib.request

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

# Alts em PT descritivo p/ as capas cujo coverAlt da API vinha em inglês/genérico.
ALT_OVERRIDE = {
    'como-montar-roteiro':'Cúpulas brancas e azuis de Santorini, na Grécia',
    'passagens-aereas-baratas':'Coliseu de Roma, na Itália',
    'quanto-custa-europa':'Grande Canal de Veneza, na Itália',
    'documentos-viagem-internacional':'Passaporte e documentos para viagem internacional',
    'primeira-viagem-internacional':'Torre Eiffel, em Paris',
    'o-que-levar-na-mala':'Malas de viagem prontas para embarque',
    'bagagem-de-mao-regras':'Mala de bordo no aeroporto',
    'seguro-viagem-vale-a-pena':'Passaporte e mapa nas mãos de um viajante',
}

# Simulação do roteiro (widget "Monte a sua X com o OND vAI") nos posts de roteiro.
ROTEIRO_SIM = {
  'roteiro-buenos-aires': {
    'dest':'Buenos Aires','flag':'🇦🇷','banner':'/assets/blog/roteiro-buenos-aires.jpg',
    'meta':'Setembro · 4 dias · Casal','air':['GRU → EZE','EZE → GRU'],'hotel':'Hotel em Palermo',
    'fin':{'total':'R$ 4.700','dia':'R$ 800','itens':[['✈️ Voos','R$ 1.900'],['🏨 Hospedagem · 3 noites','R$ 1.400'],['🍽️ Gastronomia','R$ 900'],['🎭 Passeios & tango','R$ 500']]},
    'days':[
      {'title':'Recoleta e Centro','acts':[{'t':'Cemitério da Recoleta','time':'09:30 - 11:30','rate':'4.8'},{'t':'Obelisco & Av. 9 de Julio','time':'12:00 - 13:00','rate':'4.6'},{'t':'Teatro Colón','time':'15:00 - 16:30','rate':'4.9'},{'t':'Café Tortoni','time':'17:30 - 18:30','rate':'4.5'}]},
      {'title':'Palermo','acts':[{'t':'Bosques de Palermo','time':'09:30 - 11:00','rate':'4.7'},{'t':'Jardín Japonés','time':'11:30 - 13:00','rate':'4.6'},{'t':'MALBA','time':'14:30 - 16:30','rate':'4.7'},{'t':'Noite em Palermo Soho','time':'20:00','rate':'4.8'}]},
      {'title':'San Telmo e La Boca','acts':[{'t':'Feira de San Telmo','time':'10:00 - 12:30','rate':'4.7'},{'t':'Caminito & La Boca','time':'13:30 - 15:30','rate':'4.6'},{'t':'La Bombonera','time':'16:00 - 17:00','rate':'4.8'},{'t':'Show de tango','time':'21:00','rate':'4.9'}]},
      {'title':'Compras e gastronomia','acts':[{'t':'Calle Florida','time':'10:00 - 12:00','rate':'4.4'},{'t':'Almoço · parrilla','time':'13:00 - 14:30','rate':'4.8'},{'t':'Puerto Madero','time':'15:00 - 17:00','rate':'4.6'},{'t':'Voo de volta · EZE','time':'20:30'}]},
    ]},
  'roteiro-lisboa': {
    'dest':'Lisboa','flag':'🇵🇹','banner':'/assets/blog/roteiro-lisboa.jpg',
    'meta':'Setembro · 4 dias · Casal','air':['GRU → LIS','LIS → GRU'],'hotel':'Hotel no Chiado',
    'fin':{'total':'R$ 10.200','dia':'R$ 2.550','itens':[['✈️ Voos','R$ 4.200'],['🏨 Hospedagem · 3 noites','R$ 3.000'],['🎟️ Passeios & museus','R$ 1.600'],['🍷 Gastronomia','R$ 1.400']]},
    'days':[
      {'title':'Alfama e centro','acts':[{'t':'Sé de Lisboa & Alfama','time':'09:30 - 12:00','rate':'4.8'},{'t':'Almoço no Time Out Market','time':'13:00 - 14:30','rate':'4.6'},{'t':'Chiado & Elevador de Santa Justa','time':'15:30 - 18:00','rate':'4.5'},{'t':'Fado no Bairro Alto','time':'21:00','rate':'4.8'}]},
      {'title':'Belém','acts':[{'t':'Torre de Belém','time':'09:00 - 11:00','rate':'4.7'},{'t':'Mosteiro dos Jerónimos','time':'11:30 - 13:00','rate':'4.8'},{'t':'Pastéis de Belém','time':'13:30 - 14:00','rate':'4.9'},{'t':'MAAT','time':'15:30 - 17:00','rate':'4.5'}]},
      {'title':'Sintra (bate-volta)','acts':[{'t':'Palácio da Pena','time':'09:30 - 12:30','rate':'4.9'},{'t':'Quinta da Regaleira','time':'14:00 - 16:30','rate':'4.8'},{'t':'Pôr do sol no Cabo da Roca','time':'18:30','rate':'4.7'}]},
      {'title':'Chiado e miradouros','acts':[{'t':'Miradouro de São Pedro de Alcântara','time':'10:00 - 11:00','rate':'4.7'},{'t':'LX Factory','time':'12:30 - 15:00','rate':'4.6'},{'t':'Compras no Chiado','time':'15:30 - 17:30','rate':'4.5'},{'t':'Voo de volta · LIS','time':'21:30'}]},
    ]},
}

EXTRA_CSS = ('\n.prose ol{margin:0 0 22px 0;padding-left:22px;color:#cfcce8}'
 '\n[data-theme="light"] .prose ol{color:#2a2540}'
 '\n.prose .tldr{font-style:normal;border-left-color:var(--green);background:var(--green-dim)}'
 '\n.prose .tldr strong{color:var(--green)}'
 '\n.art-cover-credit{font-size:.72rem;color:var(--muted2);margin:-22px 0 30px;text-align:center}'
 '\n.faq{margin:36px 0 0}'
 '\n.faq h2{font-size:1.72rem;font-weight:800;letter-spacing:-.02em;margin-bottom:16px}'
 '\n.faq-item{border:1px solid var(--border);border-radius:14px;padding:16px 20px;margin-bottom:12px;background:var(--card)}'
 '\n.faq-item h3{font-size:1.1rem;font-weight:700;margin-bottom:8px;color:var(--text)}'
 '\n.faq-item p{font-size:1rem;color:var(--muted);line-height:1.75;margin:0}'
 '\n.roteiro-sim-wrap{margin:40px auto 26px;text-align:center}'
 '\n.roteiro-sim-wrap>h2{font-size:1.72rem;font-weight:800;letter-spacing:-.02em;margin:0 0 10px}'
 '\n.rsim-sub{font-size:1rem;color:var(--muted);max-width:560px;margin:0 auto 22px;line-height:1.6}\n')

# Ícone de pin (mesmo da timeline de roteiro do app OND).
PIN_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 '
 '5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>')

def roteirize(prose):
    """Converte o bloco 'Dia N: ...' num timeline visual (cards de dia + paradas com pin),
    replicando a cara do roteiro dentro do app OND. Só é chamada para a categoria roteiros."""
    block_re = re.compile(r'(?:<p><strong>Dia\s*\d+:.*?</strong>.*?</p>\s*)+', re.S)
    day_re   = re.compile(r'<p><strong>(Dia\s*\d+):\s*(.*?)\.?</strong>\s*(.*?)</p>', re.S)
    def build(m):
        out = ['<div class="roteiro-timeline">']
        for num, title, body in day_re.findall(m.group(0)):
            body = re.sub(r'\s+', ' ', body).strip()
            note = ''
            mm = re.match(r'(.*?[^.])\.\s+([A-ZÀ-Ý].*?)\.?$', body, re.S)
            if mm and ',' in mm.group(2):           # frase-nota depois da lista de paradas
                body, note = mm.group(1), mm.group(2)
            body  = re.sub(r'\s+e\s+', ', ', body.strip().rstrip('.'))
            stops = [s.strip() for s in body.split(',') if s.strip()]
            out.append('<div class="rt-day"><div class="rt-day-head">'
                       f'<span class="rt-day-badge">{esc(num)}</span>'
                       f'<h3 class="rt-day-title">{esc(title.strip())}</h3></div><div class="rt-card">')
            out += [f'<div class="rt-stop"><span class="rt-pin">{PIN_SVG}</span>'
                    f'<span class="rt-stop-text">{esc(s)}</span></div>' for s in stops]
            if note:
                out.append(f'<p class="rt-note">{esc(note)}</p>')
            out.append('</div></div>')
        out.append('</div>')
        return ''.join(out)
    return block_re.sub(build, prose, count=1)

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
        make_webp(path)
        return '/assets/blog/'+cs+'.jpg'
    except Exception as e:
        print('    ! capa falhou (%s), usando URL externa' % e)
        return url

# cache de dimensões do webp por caminho de capa (/assets/blog/<slug>.jpg)
_WEBP = {}

def make_webp(jpg_path):
    """Gera <jpg>.webp redimensionado (máx 800px de largura) e guarda as dimensões.
    Falha silenciosa se Pillow não estiver disponível — o JPG segue como fallback."""
    try:
        from PIL import Image
        im = Image.open(jpg_path).convert('RGB')
        ow, oh = im.size
        if ow > 800:
            im = im.resize((800, round(oh*800/ow)), Image.LANCZOS)
        w, h = im.size
        im.save(os.path.splitext(jpg_path)[0]+'.webp', 'WEBP', quality=80, method=6)
        _WEBP['/assets/blog/'+os.path.basename(jpg_path)[:-4]] = (w, h)
    except Exception as e:
        print('    ! webp falhou (%s), só JPG' % e)

def img_tag(cover, alt, loading):
    """<picture> com fonte webp + <img> jpg de fallback (com width/height se conhecidos).
    Se a capa for externa (http) ou sem webp, devolve um <img> simples."""
    a = esc(alt)
    if cover.startswith('/assets/blog/') and cover.endswith('.jpg'):
        base = cover[:-4]
        wh = _WEBP.get(base)
        dim = f' width="{wh[0]}" height="{wh[1]}"' if wh else ''
        return (f'<picture><source srcset="{base}.webp" type="image/webp">'
                f'<img src="{esc(cover)}" alt="{a}"{dim} loading="{loading}"></picture>')
    return f'<img src="{esc(cover)}" alt="{a}" loading="{loading}">'

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
    # posts sao indexaveis: remove o noindex que vem herdado do post-modelo.html
    s = re.sub(r'\s*<meta name="robots"[^>]*>', '', s, count=1)
    # remove o @graph (Article + BreadcrumbList) fixo herdado do template
    s = re.sub(r'\s*<script type="application/ld\+json">\s*\{[^<]*?"@graph".*?</script>', '', s, count=1, flags=re.S)
    # Article + BreadcrumbList com os dados REAIS deste post
    pub = p.get('createdAt') or p.get('updatedAt') or '2026-07-10'
    mod = p.get('updatedAt') or pub
    graph = {'@context':'https://schema.org','@graph':[
        {'@type':'Article','headline':title,'description':desc,'image':ogimg,
         'datePublished':pub,'dateModified':mod,'inLanguage':'pt-BR',
         'mainEntityOfPage':canon,'articleSection':CAT_LABEL.get(cat,cat),
         'author':{'@type':'Organization','name':'OND','url':SITE+'/'},
         'publisher':{'@type':'Organization','name':'OND',
             'logo':{'@type':'ImageObject','url':SITE+'/assets/ond-logo.png'}}},
        {'@type':'BreadcrumbList','itemListElement':[
            {'@type':'ListItem','position':1,'name':'Início','item':SITE+'/'},
            {'@type':'ListItem','position':2,'name':'Vai para onde?','item':SITE+'/blog.html'},
            {'@type':'ListItem','position':3,'name':title,'item':canon}]}]}
    s = s.replace('</head>', '<script type="application/ld+json">'+json.dumps(graph, ensure_ascii=False)+'</script>\n</head>', 1)
    faqs = p.get('faq') or []
    if faqs:
        schema = {'@context':'https://schema.org','@type':'FAQPage','mainEntity':[
            {'@type':'Question','name':f['q'],'acceptedAnswer':{'@type':'Answer','text':f['a']}} for f in faqs]}
        s = s.replace('</head>', '<script type="application/ld+json">'+json.dumps(schema, ensure_ascii=False)+'</script>\n</head>', 1)
    return s

def build_sim(cs):
    d = ROTEIRO_SIM.get(cs)
    if not d: return ''
    cfg = json.dumps(d, ensure_ascii=False)
    return ('\n  <section class="roteiro-sim-wrap">'
        '\n  <h2>Monte a sua ' + esc(d['dest']) + ' com o OND vAI</h2>'
        '\n  <p class="rsim-sub">Veja o OND vAI transformar este roteiro num plano completo — dia a dia, voos, hospedagem e orçamento — e leve tudo no app.</p>'
        '\n  <div id="roteiro-sim"></div>'
        '\n  </section>'
        '\n  <script>window.RSIM = ' + cfg + ';</script>'
        '\n  <script src="/assets/roteiro-sim.js" defer></script>\n')

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
    # o html da API ja traz um FAQ proprio -> remove (usamos o nosso estilizado + schema)
    prose = re.sub(r'<h2[^>]*>Perguntas frequentes.*', '', prose, flags=re.S)
    sim_html = build_sim(cs)
    if sim_html:
        # nos posts de roteiro, o widget substitui o bloco de texto "Monte a sua {dest}"
        prose = re.sub(r'<h2[^>]*>Monte a sua.*', '', prose, flags=re.S)
    if cat == 'roteiros':
        prose = roteirize(prose)
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
      f'  <div class="art-cover">{img_tag(cover, p.get("coverAlt",""), "eager")}</div>{credit_html}\n'
      f'  <div class="prose">\n{prose}\n  </div>\n{sim_html}{faq_html}'
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
          f'    <div class="featured-thumb">{img_tag(cover, p.get("coverAlt",""), "lazy")}</div>\n'
          f'    <div class="featured-body">\n'
          f'      <span class="post-tag {tc}">{esc(tag)}</span>\n'
          f'      <h2 class="featured-title">{esc(p["title"])}</h2>\n'
          f'      <p class="featured-excerpt">{esc(ex)}</p>\n'
          f'      <div class="post-meta"><span>Ondino</span><span class="dot"></span><span>{date}</span><span class="dot"></span><span>{rmin} min de leitura</span></div>\n'
          f'    </div>\n  </a>')
    return (f'<a href="{href}" class="post-card" data-cat="{cat}">\n'
      f'      <div class="post-thumb">{img_tag(cover, p.get("coverAlt",""), "lazy")}</div>\n'
      f'      <div class="post-body">\n'
      f'        <span class="post-tag {tc}">{esc(tag)}</span>\n'
      f'        <h3 class="post-title">{esc(p["title"])}</h3>\n'
      f'        <p class="post-excerpt">{esc(ex)}</p>\n'
      f'        <div class="post-meta"><span>{date}</span><span class="dot"></span><span>{rmin} min</span></div>\n'
      f'      </div>\n    </a>')

def write_sitemap(meta):
    """Reescreve o sitemap.xml: paginas fixas + os posts reais. Sem post-modelo.html."""
    today = datetime.date.today().isoformat()
    fixed = [('', '1.0', 'weekly'), ('agencias.html', '0.9', 'monthly'),
             ('assessoria.html', '0.8', 'monthly'), ('blog.html', '0.7', 'weekly')]
    urls = []
    for path, prio, freq in fixed:
        urls.append(f'  <url>\n    <loc>{SITE}/{path}</loc>\n    <lastmod>{today}</lastmod>\n'
                    f'    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>\n  </url>')
    for p, cs, cover, cat in meta:
        lastmod = p.get('updatedAt') or today
        urls.append(f'  <url>\n    <loc>{SITE}/blog/{cs}/</loc>\n    <lastmod>{lastmod}</lastmod>\n'
                    f'    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>')
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + '\n'.join(urls) + '\n</urlset>\n')
    open(os.path.join(ROOT,'sitemap.xml'),'w',encoding='utf-8',newline='\n').write(xml)
    print('sitemap.xml atualizado (%d urls)' % len(urls))

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
        if cs in ALT_OVERRIDE:
            p['coverAlt'] = ALT_OVERRIDE[cs]
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

    write_sitemap(meta)
    # Reaplica a seção de marketing multi-idioma (alternates hreflang) por cima:
    # build-i18n preserva os <url> do blog que acabamos de escrever e reescreve o
    # marketing com os alternates. Assim o sitemap final fica correto mesmo quando
    # build-blog.py é o último a rodar (evita perder as URLs en/es/fr/it).
    try:
        import importlib.util
        _spec = importlib.util.spec_from_file_location('build_i18n', os.path.join(ROOT, 'build-i18n.py'))
        _i18n = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_i18n)
        _i18n.write_sitemap()
    except Exception as e:
        print('  aviso: nao reapliquei os alternates i18n no sitemap (%s)' % e)
    print('OK')

if __name__ == '__main__':
    main()
