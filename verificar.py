#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verificar.py: passa o site inteiro pelas regras da casa e lista o que está fora.

Roda sem rede e sem dependência: le os arquivos do repositorio e compara.
Saida com código 0 quando esta tudo certo, 1 quando ha erro. Aviso nao derruba.

    python verificar.py           tudo
    python verificar.py links     so um bloco (links, emoji, travessao, noindex,
                                  sitemap, meta, idioma)

Na CI o modo e outro, porque o site ja nasceu com divida:

    python verificar.py --teto        falha so se a divida CRESCER
    python verificar.py --gravar-teto anota a divida de hoje como teto

O teto fica em .verificar-teto.json, um numero por bloco. Serve de catraca: o que
esta errado hoje continua visivel, mas erro novo nao entra. Ao limpar um bloco,
gravar o teto de novo para ele nao voltar a subir.

O que cada bloco cobre esta na funcao correspondente. Regra nova entra aqui, nao
na cabeca de quem revisa.
"""
import os, re, sys, io, glob, json

ROOT = os.path.dirname(os.path.abspath(__file__))

# Pastas que nao sao pagina do site: geradas, internas ou de apoio.
IGNORA_DIR = {'.git', '__pycache__', 'node_modules', 'graphify-out', 'relatorios',
              'i18n', 'tokens', 'assets', '.claude', '.github'}

# Paginas privadas: entram com noindex e ficam fora do sitemap.
PRIVADAS = ('proposta/', 'cliente/')

# Emoji de verdade, o que da "cara de IA" na pagina. Glifo de interface fica de
# fora de proposito: seta (-> <-), menu (☰), check (✓ ✕), caixa (☐), estrela (★)
# e ponta (➤) sao desenho de UI, nao emoji.
EMOJI = re.compile(
    u'[\U0001F000-\U0001FAFF]'          # pictograma, bandeira, transporte, mao
    u'|.️'                         # qualquer glifo pedindo aparencia de emoji
    u'|[✨⭐❗❤✈☀⚡⛱]'  # brilho, estrela, aviao, sol
)

TRAVESSAO = u'—'


def paginas():
    """Todo .html que e pagina do site, caminho relativo com barra normal."""
    fora = []
    for p in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
        rel = os.path.relpath(p, ROOT).replace('\\', '/')
        if any(parte in IGNORA_DIR for parte in rel.split('/')[:-1]):
            continue
        fora.append(rel)
    return sorted(fora)


def texto_visivel(html):
    """So o que o visitante le: sem script, sem style, sem tag."""
    t = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', html)
    t = re.sub(r'(?is)<!--.*?-->', ' ', t)
    return re.sub(r'(?s)<[^>]+>', ' ', t)


def ler(rel):
    return io.open(os.path.join(ROOT, rel), encoding='utf-8', errors='ignore').read()


# ─────────────────────────────── blocos ───────────────────────────────

def ck_emoji(pgs, erro, aviso):
    """Sem emoji em pagina nenhuma. Icone e SVG monocromatico."""
    for rel in pgs:
        achados = EMOJI.findall(texto_visivel(ler(rel)))
        if achados:
            lista = ' '.join(sorted(set(achados))[:6])
            erro('emoji', '%s: %s' % (rel, lista))


def ck_travessao(pgs, erro, aviso):
    """Sem travessao em texto. Reescrever a frase."""
    for rel in pgs:
        vis = texto_visivel(ler(rel))
        if TRAVESSAO in vis:
            trecho = vis[max(0, vis.index(TRAVESSAO) - 40):vis.index(TRAVESSAO) + 40]
            erro('travessao', '%s: ...%s...' % (rel, ' '.join(trecho.split())))
    for md in glob.glob(os.path.join(ROOT, 'relatorios', '*.md')):
        rel = os.path.relpath(md, ROOT).replace('\\', '/')
        if TRAVESSAO in io.open(md, encoding='utf-8', errors='ignore').read():
            erro('travessao', rel)


def ck_links(pgs, erro, aviso):
    """Link interno tem que existir no disco."""
    for rel in pgs:
        base = os.path.dirname(rel)
        # Fora do <script>: endereco montado em JavaScript ("'+url+'") nao e link.
        html = re.sub(r'(?is)<(script|style)[^>]*>.*?</\1>', ' ', ler(rel))
        for href in re.findall(r'(?i)(?:href|src)="([^"#?]+)"', html):
            if re.match(r'(?i)^(https?:|mailto:|tel:|data:|//|#|javascript:)', href):
                continue
            alvo = href.lstrip('/') if href.startswith('/') else os.path.normpath(
                os.path.join(base, href)).replace('\\', '/')
            cheio = os.path.join(ROOT, alvo)
            if os.path.isdir(cheio):
                if not os.path.exists(os.path.join(cheio, 'index.html')):
                    erro('link', '%s: %s e pasta sem index.html' % (rel, href))
            elif not os.path.exists(cheio):
                erro('link', '%s: %s nao existe' % (rel, href))


def ck_noindex(pgs, erro, aviso):
    """Proposta e pagina de cliente nunca vao para busca."""
    for rel in pgs:
        if not rel.startswith(PRIVADAS):
            continue
        if 'noindex' not in ler(rel):
            erro('noindex', '%s: falta a meta robots noindex' % rel)


def ck_sitemap(pgs, erro, aviso):
    """Sitemap bate com o que existe, e nao lista pagina privada."""
    caminho = os.path.join(ROOT, 'sitemap.xml')
    if not os.path.exists(caminho):
        return erro('sitemap', 'sitemap.xml nao existe')
    urls = re.findall(r'<loc>\s*([^<]+?)\s*</loc>', ler('sitemap.xml'))
    listadas = set()
    for u in urls:
        caminho_url = re.sub(r'^https?://[^/]+/?', '', u).rstrip('/')
        alvo = os.path.join(ROOT, caminho_url, 'index.html') if caminho_url and not \
            caminho_url.endswith('.html') else os.path.join(ROOT, caminho_url or 'index.html')
        listadas.add(os.path.relpath(alvo, ROOT).replace('\\', '/'))
        if not os.path.exists(alvo):
            erro('sitemap', '%s esta no sitemap e nao existe' % u)
        if caminho_url.startswith(PRIVADAS):
            erro('sitemap', '%s e pagina privada e nao pode estar no sitemap' % u)
    for rel in pgs:
        if rel.startswith(PRIVADAS) or rel == 'post-modelo.html':
            continue
        if rel not in listadas:
            aviso('sitemap', '%s existe e esta fora do sitemap' % rel)


def ck_meta(pgs, erro, aviso):
    """Toda pagina publica tem titulo e descricao."""
    for rel in pgs:
        if rel.startswith(PRIVADAS):
            continue
        html = ler(rel)
        titulo = re.search(r'(?is)<title[^>]*>(.*?)</title>', html)
        if not titulo or not titulo.group(1).strip():
            erro('meta', '%s: sem <title>' % rel)
        desc = re.search(r'(?is)<meta[^>]+name="description"[^>]+content="([^"]*)"', html)
        if not desc or len(desc.group(1).strip()) < 50:
            aviso('meta', '%s: descricao curta ou ausente' % rel)


def ck_idioma(pgs, erro, aviso):
    """<html lang> combinando com a pasta do idioma."""
    for rel in pgs:
        m = re.search(r'(?is)<html[^>]*\blang="([^"]+)"', ler(rel))
        if not m:
            erro('idioma', '%s: <html> sem lang' % rel)
            continue
        lang, pasta = m.group(1).lower(), rel.split('/')[0]
        esperado = pasta if pasta in ('en', 'es', 'fr', 'it') else 'pt-br'
        if not lang.startswith(esperado):
            erro('idioma', '%s: lang="%s", esperado "%s"' % (rel, m.group(1), esperado))


BLOCOS = {
    'links': ck_links, 'emoji': ck_emoji, 'travessao': ck_travessao,
    'noindex': ck_noindex, 'sitemap': ck_sitemap, 'meta': ck_meta, 'idioma': ck_idioma,
}


TETO = os.path.join(ROOT, '.verificar-teto.json')


def conta(erros):
    c = {}
    for bloco, _ in erros:
        c[bloco] = c.get(bloco, 0) + 1
    return c


def modo_teto(erros, gravar):
    """Catraca: divida velha passa, divida nova nao."""
    atual = conta(erros)
    if gravar:
        io.open(TETO, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(atual, indent=2, sort_keys=True) + '\n')
        print('teto gravado: %s' % (atual or 'zero erros'))
        return 0

    try:
        teto = json.loads(io.open(TETO, encoding='utf-8').read())
    except Exception:
        print('sem .verificar-teto.json: rode --gravar-teto uma vez')
        return 2

    subiu = False
    for bloco in sorted(set(list(atual) + list(teto))):
        agora, limite = atual.get(bloco, 0), teto.get(bloco, 0)
        if agora > limite:
            print('SUBIU  %-10s %d erros, o teto era %d' % (bloco, agora, limite))
            subiu = True
        elif agora < limite:
            print('caiu   %-10s %d erros, o teto era %d (regrave o teto)'
                  % (bloco, agora, limite))
    if not subiu:
        print('nada novo: %d erros, dentro do teto' % len(erros))
    return 1 if subiu else 0


def main():
    args = sys.argv[1:]
    gravar = '--gravar-teto' in args
    catraca = '--teto' in args or gravar
    pedido = [a for a in args if not a.startswith('--')] or list(BLOCOS)

    desconhecido = [b for b in pedido if b not in BLOCOS]
    if desconhecido:
        print('bloco desconhecido: %s' % ', '.join(desconhecido))
        print('disponiveis: %s' % ', '.join(BLOCOS))
        return 2

    erros, avisos = [], []
    pgs = paginas()
    for nome in pedido:
        BLOCOS[nome](pgs,
                     lambda b, m: erros.append((b, m)),
                     lambda b, m: avisos.append((b, m)))

    if catraca:
        return modo_teto(erros, gravar)

    for rotulo, lista in (('ERRO', erros), ('aviso', avisos)):
        for bloco, msg in lista:
            print('%-6s %-10s %s' % (rotulo, bloco, msg))

    print('')
    print('%d paginas, %d erros, %d avisos' % (len(pgs), len(erros), len(avisos)))
    return 1 if erros else 0


if __name__ == '__main__':
    sys.exit(main())
