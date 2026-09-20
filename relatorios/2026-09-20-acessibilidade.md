# Acessibilidade: o que estava fora da norma e o que foi corrigido

**Data:** 20 de setembro de 2026
**Método:** motor do AccessLint (WCAG 2.2) sobre o DOM vivo, Playwright para fluxo e alvo de toque, e medição direta dos valores computados de cor nos dois temas.
**Escopo:** home, `/viagens/`, `/viagens/maceio/`, `blog.html`, `agencias.html` e `/agencias/planos/`. As correções valem para o site inteiro, porque quase tudo veio de decisão de CSS repetida.

---

## 1. Retrato antes

| Página | Violações | Sérias | Pior caso |
|---|---|---|---|
| blog.html | 130 | 121 | resumo dos posts a 2,50:1 |
| /viagens/ | 124 | 117 | migalha e créditos a 2,11:1 |
| agencias.html | 18 | 9 | "Área do cliente" a 1,53:1 |
| home | 17 | 5 | rodapé a 2,52:1 |
| /viagens/maceio/ | 6 | 5 | rodapé a 2,52:1 |
| /agencias/planos/ | 7 | 6 | rodapé a 2,80:1 |

**302 violações**, vindas de cerca de 18 decisões de CSS.

## 2. A causa

O token `--muted` sempre passou: 5,71:1 no tema escuro e 5,03:1 no claro. Quem reprovava era o `--muted2`, definido como `color-mix` do muted com o **fundo** em 45%. Essa mistura derrubava para 2,52:1 no escuro e 2,18:1 no claro, e ele é usado em 272 lugares: títulos das colunas do rodapé, linha do CNPJ, migalha de caminho, resumo dos posts, créditos das fotos, aviso de cookies e a nota da chamada final.

O resto vinha de `opacity` empilhado em texto (o link "Área do cliente" com `opacity:.5` dava 1,53:1) e de cores pensadas só para o tema escuro, como as etiquetas de categoria do blog, que no tema claro ficavam entre 1,77 e 2,38:1.

## 3. O que foi feito

| O que | Onde | Efeito |
|---|---|---|
| `--muted2` deixa de ser misturado com o fundo | 41 arquivos e os dois CSS compartilhados | 2,52 passa a 5,71:1 no escuro, 2,18 a 5,03:1 no claro |
| Folha nova `assets/acessibilidade.css` | carregada por 83 páginas | roxo e azul do topo por tema, selo e preço do plano, etiquetas do blog no claro, selos do painel B2B |
| `opacity` fora de texto | link da área do cliente e seta do idioma | 1,53 passa a 5,03:1 |
| `<main>` em volta do conteúdo | 32 páginas que não tinham | leitor de tela passa a ter marco principal |
| "Pular para o conteúdo" | 26 páginas que não tinham | quem usa teclado deixa de percorrer o topo inteiro |
| Títulos do rodapé de h4 para h3 | 64 páginas | a hierarquia deixa de pular de h2 para h4 |
| Nome no link do logotipo | 65 páginas | "Link sem texto" era falha séria no blog, que não carrega o `a11y.js` |
| Alvo de toque de 24px no celular | pontos do carrossel, "Ver detalhes", links do rodapé e migalha | 42 alvos pequenos passam a 12 |
| Foco na janela de contratação | `agencias.html` | o foco entra no primeiro campo, fica preso na janela e volta de onde saiu |
| Título vazio do globo | `assets/globe.js` | só existe depois de receber o nome do destino |

## 4. Como está agora

Medição direta dos valores computados, nas cinco páginas, nos dois temas:

| Tema | Texto abaixo do mínimo |
|---|---|
| escuro | 0 |
| claro | 6, todos o nome do destino escrito por cima da foto |

Os seis são limite do método, não falha: o nome fica sobre a foto com escurecimento na base, e a medição por CSS não alcança pixel de imagem.

No fluxo, com Playwright: filtros do catálogo, janela de busca por `/` com resultado sem acento, `?plano=` trazendo o plano certo, Escape fechando a janela e nenhuma rolagem horizontal no celular.

## 5. O que ficou

- **12 alvos de toque abaixo de 24px** em `/viagens/`: são os créditos das fotos, links no meio de frase, que a própria norma dispensa (2.5.8, exceção de texto em linha).
- **Aviso de "conteúdo fora de marco"** nas janelas de contato, do app, do OND vAI e do aviso de cookies. São diálogos sobrepostos, onde o aviso não se aplica bem.
- **Peso e imagem**: 48 imagens sem `width`/`height` na home e no catálogo, que causam pulo de layout, e cinco fotos de ocasião entre 115 e 241 KB. Não entrou nesta rodada.
- **Medição instável do AccessLint em página com transição de entrada**: rodando duas vezes seguidas na mesma página, os números de contraste mudam, porque a captura pega o momento em que o conteúdo ainda está surgindo. Para conferir contraste, vale a medição por valores computados descrita aqui.

## 6. Como manter

- Texto novo usa `var(--text)` ou `var(--muted)`. **Não usar `opacity` para apagar texto**: apagar com cor, não com transparência.
- Cor fixa só quando o tema não muda o fundo. Se mudar, escrever a regra dentro de `[data-theme="dark"]` e `[data-theme="light"]`.
- Página nova nasce com `<main>`, com o link de pular e com nome no logotipo.
- Antes de publicar mudança grande de layout, rodar a medição dos dois temas e o teste de fluxo.
