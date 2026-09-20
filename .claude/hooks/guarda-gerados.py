#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hook PreToolUse: barra edicao a mao em arquivo que e saida de script.

Editar essas paginas parece funcionar e o trabalho some no proximo build. O hook
diz qual script gera o arquivo e qual e a fonte de verdade, e devolve o controle.

Sai com 2 para bloquear (a mensagem do stderr volta para o modelo) e 0 para deixar
passar. Qualquer erro aqui deixa passar de proposito: hook quebrado nao pode
travar o trabalho.
"""
import json, os, re, sys

# padrao do caminho -> (quem gera, qual e a fonte)
GERADOS = [
    (r'^viagens/[^/]+/index\.html$',
     'build-destinos.py', 'as fichas <article class="dc"> em viagens/index.html'),
    (r'^blog/[^/]+/index\.html$',
     'build-blog.py', 'o .md em ond-conteudo/b2c/blog/, que vai para a API da Firma'),
    (r'^agencias/planos/',
     'build-agencias.py', 'os planos em agencias.html'),
    (r'^busca/index\.html$|^assets/busca\.json$',
     'build-busca.py', 'os destinos, os posts e as paginas fixas'),
    (r'^(en|es|fr|it)/index\.html$',
     'build-i18n-home.py', 'index.html na raiz mais i18n/home-traducoes.json'),
    (r'^sitemap\.xml$',
     'build-blog.py', 'as paginas que existem no disco'),
    (r'^proposta/README\.md$',
     'build-registro.py', 'as proprias paginas em proposta/*/index.html'),
    (r'^tokens/.*\.css$',
     './sync.ps1', 'o design system em C:\\_tudo\\Agama\\OND\\ond-design-system'),
]


def main():
    try:
        dados = json.load(sys.stdin)
    except Exception:
        return 0

    if dados.get('tool_name') not in ('Write', 'Edit', 'NotebookEdit'):
        return 0

    caminho = (dados.get('tool_input') or {}).get('file_path') or ''
    if not caminho:
        return 0

    raiz = os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd()
    try:
        rel = os.path.relpath(caminho, raiz).replace('\\', '/')
    except ValueError:
        return 0
    if rel.startswith('..'):
        return 0

    for padrao, script, fonte in GERADOS:
        if re.match(padrao, rel):
            sys.stderr.write(
                'Nao edite %s a mao: quem gera esse arquivo e o %s, e a proxima '
                'execucao apaga a alteracao.\n'
                'A fonte de verdade e %s. Mexa la e rode o script.\n'
                % (rel, script, fonte))
            return 2

    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)
