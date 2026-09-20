#!/usr/bin/env python3
"""Gera proposta/README.md (registro das propostas) lendo as páginas publicadas.

Só entra o que já é público na própria página: cliente, título, chips (datas e pessoas),
link e validade. Preço interno, custo, lucro e telefone ficam fora: isso vive no OND Firma.

Uso: python build-registro.py
"""
import os, re, html, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(ROOT, 'proposta')
MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']


def texto(m):
    return html.unescape(re.sub(r'<[^>]+>', '', m)).strip() if m else ''


def ler(slug):
    p = os.path.join(DIR, slug, 'index.html')
    if not os.path.isfile(p):
        return None
    s = open(p, encoding='utf-8', errors='replace').read()
    para = texto((re.search(r'<div class="para">(.*?)</div>', s, re.S) or [None, ''])[1])
    titulo = texto((re.search(r'<h1>(.*?)</h1>', s, re.S) or [None, ''])[1])
    bloco = re.search(r'class="chips">(.*?)</div>', s, re.S)
    chips = [html.unescape(texto(c)) for c in re.findall(r'<span[^>]*>(.*?)</span>', bloco.group(1), re.S)] if bloco else []
    val = (re.search(r"VALIDADE = new Date\('([\d-]+)", s) or [None, ''])[1]
    rastreio = 'api/proposals/' in s
    return {'slug': slug, 'para': para, 'titulo': titulo, 'chips': chips, 'validade': val, 'rastreio': rastreio}


def main():
    slugs = sorted(d for d in os.listdir(DIR) if os.path.isdir(os.path.join(DIR, d)))
    linhas = []
    for slug in slugs:
        p = ler(slug)
        if not p:
            continue
        quando = p['chips'][0] if p['chips'] else ''
        quem = ' · '.join(p['chips'][1:]) if len(p['chips']) > 1 else ''
        val = ''
        if p['validade']:
            try:
                d = datetime.date.fromisoformat(p['validade'])
                val = '%d de %s de %d' % (d.day, MESES[d.month - 1], d.year)
            except ValueError:
                val = p['validade']
        linhas.append('| %s | %s | %s | %s | [abrir](https://ondviajar.com.br/proposta/%s/) | %s | %s |' % (
            p['para'].replace('Para a ', '').replace('Para o ', '').replace('Para ', ''),
            p['titulo'], quando, quem, slug, val, 'sim' if p['rastreio'] else 'não'))

    hoje = datetime.date.today()
    txt = [
        '# Propostas publicadas',
        '',
        'Registro das páginas de proposta que estão no ar em `ondviajar.com.br/proposta/`.',
        'Gerado por `build-registro.py` a partir das próprias páginas, então basta rodar o script depois de publicar uma proposta nova.',
        '',
        'Preço de custo, lucro, telefone do cliente e histórico de negociação não entram aqui: isso fica no OND Firma, no Deal Hub.',
        '',
        '| Cliente | Viagem | Quando | Detalhes | Página | Proposta válida até | Avisa quando abre |',
        '|---|---|---|---|---|---|---|',
    ] + linhas + [
        '',
        '**Avisa quando abre** é o rastreio que dispara "proposta visualizada" quando o cliente entra na página.',
        'Para conferir a sua própria proposta sem disparar o aviso, abra uma vez com `?team` no fim do endereço.',
        '',
        'Atualizado em %d/%02d/%d.' % (hoje.day, hoje.month, hoje.year),
        '',
    ]
    open(os.path.join(DIR, 'README.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(txt))
    print('proposta/README.md atualizado (%d propostas)' % len(linhas))


if __name__ == '__main__':
    main()
