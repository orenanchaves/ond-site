# ond-site

Site público do OND, em `ondviajar.com.br`. HTML estático servido pelo GitHub Pages, sem build
de framework e sem `npm install`. As páginas derivadas saem de scripts Python que rodam na mão.

Publicar é `git push`. O Pages atualiza sozinho em um ou dois minutos.

## O que é escrito à mão e o que é gerado

Editar à mão só o que é fonte. O resto é saída de script e some no próximo build.

| Caminho | Origem |
|---|---|
| `index.html`, `agencias.html`, `blog.html`, `hoteis.html`, `assessoria.html`, `links.html` | à mão |
| `viagens/index.html` (catálogo) e `viagens/quando-viajar/` | à mão, é a fonte dos destinos |
| `proposta/<slug>/`, `cliente/<slug>/` | à mão, uma pasta por cliente |
| `viagens/<slug>/` | `build-destinos.py` |
| `blog/<slug>/`, cards e categorias do `blog.html` | `build-blog.py` |
| `agencias/planos/` | `build-agencias.py` |
| `busca/` e `assets/busca.json` | `build-busca.py` |
| `en/`, `es/`, `fr/`, `it/` | `build-i18n-home.py` |
| `sitemap.xml` | `build-blog.py` |
| `proposta/README.md` | `build-registro.py` |
| `tokens/*.css` | design system, copiado pelo `sync.ps1` |

### Ordem quando mexe em muita coisa

```bash
python build-destinos.py   # depois de mexer no catálogo
python build-blog.py       # puxa os posts da API da Firma, reescreve o sitemap
python build-busca.py      # depende dos dois de cima
python build-i18n-home.py  # depois de mexer na home
python build-registro.py   # depois de publicar proposta
```

`build-blog.py` lê `https://ond-firma.ond-jarvis.workers.dev/api/blog/posts` e só traz o que está
aprovado na Firma. Se o post novo não aparecer, ele não foi aprovado lá.

**O blog já se publica sozinho.** A Action `.github/workflows/blog-programado.yml` roda todo dia
às 07:00 de Brasília, gera o blog a partir do feed, commita se `blog/` mudou e pede o build do
Pages. Ela também roda na mão pela aba Actions. Rodar `build-blog.py` aqui só serve para publicar
na hora, sem esperar a manhã seguinte.

## Verificar antes de dar push

```bash
python verificar.py            # tudo
python verificar.py links      # um bloco só
```

Checa link interno quebrado, emoji, travessão, `noindex` nas páginas privadas, sitemap batendo
com o disco, título e descrição, e `lang` combinando com a pasta do idioma. Sai com código 1
quando há erro. Aviso não derruba. Regra nova entra no script, não só aqui.

Ele separa emoji de glifo de interface: `→`, `☰`, `✓` e `✕` passam, `📲` e `👉` não.

Um hook (`.claude/hooks/guarda-gerados.py`) barra edição à mão nos arquivos gerados da tabela
acima e diz qual script e qual fonte usar. Se ele atrapalhar, a lista está no topo do script.

## Regras de escrita

- Tudo em português do Brasil.
- **Sem emoji** em nenhuma página. Ícone é SVG monocromático.
- **Sem travessão.** Nada de `—` em título, texto, post ou relatório. Reescrever a frase.
- Nada inventado: preço, métrica e citação precisam de fonte, e faixa de mercado vai com a data
  da pesquisa.

## Propostas de cliente

Uma pasta por cliente em `proposta/<slug>/`, com `index.html` e `capa.jpg`. Todas levam `noindex`.

- Pix é custo mais 15%, arredondado para cima na dezena. O cartão é `Pix / 0,95`, ou seja, o Pix
  aparece como **5% de desconto**, nunca o cartão como acréscimo.
- Cartão à vista sem acréscimo, parcelado até 10x **com juros de 1,99% ao mês** (tabela Price).
  Nada de "sem juros". A página abre em cartão 10x, com o valor da parcela em destaque e o preço
  do Pix embaixo.
- Toda proposta tem validade escrita na página, dois dias.
- O custo da consolidadora não entra na página. Custo e lucro ficam só na Firma, no Deal Hub.
- O rastreio "proposta visualizada" dispara quando o cliente abre. Para conferir sem disparar,
  abrir uma vez com `?team` no fim do endereço.
- Destino sem aeroporto ganha nota de traslado. A skill `chegada-do-destino` tem a tabela.
- Depois de publicar, rodar `build-registro.py` para atualizar `proposta/README.md`.

Página em `cliente/<slug>/` é material de negociação atrás de chave. **Cada página precisa da
própria chave de sessão**, senão uma destrava a outra.

## Relatórios

Análise de arquitetura da informação, SEO, acessibilidade ou design vira arquivo em
`relatorios/AAAA-MM-DD-assunto.md`, além do resumo na conversa. O padrão está em
`relatorios/README.md`. Relatório não é página do site: fica fora do sitemap e fora do menu.

## Armadilhas

- **`build-i18n.py` está quebrado.** Para en/es/fr/it da home, usar `build-i18n-home.py`. Ele
  traduz por correspondência exata de texto, então frase nova sem tradução em
  `i18n/home-traducoes.json` fica em português e aparece listada no fim da execução.
- **`tokens/*.css` é cópia.** A fonte é `C:\_tudo\Agama\OND\ond-design-system`. Editar lá,
  rodar `node scripts/build.mjs` e depois `./sync.ps1` aqui. Ver `tokens/SYNC.md`.
- **`build-blog.py` e `build-i18n.py` escrevem o mesmo `sitemap.xml`.** Se um dia o i18n voltar
  a rodar, ele vem depois do blog.
- **`llms.txt` é escrito à mão** e precisa acompanhar destino ou página nova.
