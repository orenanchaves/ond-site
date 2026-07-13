# SEO Audit v2 — ond-site (estado atual, 2026-07-13)

Re-análise do estado ATUAL, após os posts reais entrarem no ar e os ajustes de CSS.

## Posts reais hoje (blog/)
10 posts, todos com conteúdo real (28–35 KB cada, sem placeholder/thin):

| slug | categoria | tamanho |
|---|---|---|
| roteiro-lisboa | Roteiros | 35,5 KB |
| roteiro-buenos-aires | Roteiros | 35,1 KB |
| documentos-viagem-internacional | Dicas | 29,4 KB |
| quanto-custa-europa | Orçamento | 29,0 KB |
| primeira-viagem-internacional | Dicas | 29,0 KB |
| passagens-aereas-baratas | Orçamento | 29,0 KB |
| como-montar-roteiro | IA (featured) | 28,9 KB |
| seguro-viagem-vale-a-pena | Dicas | 28,8 KB |
| bagagem-de-mao-regras | Dicas | 28,8 KB |
| o-que-levar-na-mala | Dicas | 28,6 KB |

blog.html linka os 10, sem cards fantasma (o "Em breve" é só empty-state de filtro + msg do newsletter). Capas existem em `assets/blog/<slug>.jpg`.

## O que está BOM (melhorou desde a v1)
- **Meta/head dos posts**: título único, description, keywords, canonical correto (`/blog/<slug>/`), OG completo (type=article, url, title, description, image, image:alt), Twitter summary_large_image — tudo gerado certo pelo build-blog.py. ✅
- **FAQPage schema**: build-blog.py injeta JSON-LD FAQPage correto por post (a partir do FAQ real). ✅
- **index.html**: schema Organization + WebSite + SoftwareApplication, OG com dimensões. ✅
- **Cards do blog.html**: `loading="lazy"` presente. ✅
- **robots.txt**: OK (Allow + Sitemap).

## O que AINDA falta (priorizado)

### 🔴 Crítico
1. **Sitemap.xml desatualizado** — não lista NENHUM dos 10 posts reais. Lista só home, agencias, assessoria, blog.html e `post-modelo.html`. Google não descobre os posts pelo sitemap. `lastmod` congelado em 2026-07-09.
2. **JSON-LD Article/Breadcrumb ERRADO em todos os 10 posts** — cada post carrega, hardcoded do template, um `Article` dizendo `headline: "5 destinos no Brasil para fugir do óbvio em 2026"`, `image: brasil-rio.jpg`, `datePublished: 2026-06-25`, `mainEntityOfPage: post-modelo.html`, e um `BreadcrumbList` cujo item 3 aponta pra `post-modelo.html`. O schema **contradiz** o título/canonical/OG reais da página → Google pode ignorar ou desqualificar o structured data. Causa: build-blog.py gera o FAQPage mas nunca substitui/remove o bloco Article do post-modelo.html (fica um 2º `<script ld+json>` errado antes do `</head>`).

### 🟠 Importante
3. **post-modelo.html indexável e no sitemap** — é o template (conteúdo thin/duplicado), sem `noindex`, e ainda referenciado no sitemap e nos breadcrumbs de todos os posts. Deveria receber `<meta name="robots" content="noindex">` (ou sair do ar) e sumir do sitemap.
4. **Sem Article schema válido nos posts** — como consequência do #2, nenhum post tem structured data Article correta (headline/datePublished/author batendo com o conteúdo). É o schema mais valioso pra um blog.

### 🟡 Bom ter
5. **Imagens pesadas, formato JPG** — várias capas 300–480 KB (paris 481, machu-picchu 462, noronha 387…), sem WebP/AVIF e sem `width`/`height` nas `<img>` (risco de CLS/LCP). Cards já têm lazy; faltam dimensões.
6. **Alt text das cards em inglês e genérico** — ex.: `alt="santorini greece blue domes"` num card de "como montar roteiro", `alt="rome colosseum italy"`. São nomes de banco de imagem, não descrevem o post nem estão em PT-BR.
7. **Google Fonts render-blocking** — `<link rel="stylesheet">` externo bloqueia render. Já tem `preconnect` e `&display=swap`, então impacto baixo; poderia self-hostar a Onest.

## Correção principal (quando for editar)
O epicentro é o **build-blog.py**: (a) gerar/substituir o bloco `Article` + `BreadcrumbList` por post usando os dados reais (title, canonical, cover, updatedAt, categoria) em vez de deixar o do template; (b) regenerar o **sitemap.xml** incluindo os 10 posts (+ remover/rebaixar post-modelo); (c) adicionar `noindex` no post-modelo.html.
