# Análise de SEO — Site OND (ondviajar.com.br)

**Data:** 2026-07-09
**Escopo:** index.html, agencias.html, blog.html, post-modelo.html, assessoria.html
**Método:** leitura dos arquivos-fonte + verificação da live (`curl` em `ondviajar.com.br` e no GitHub Pages).
**Repo:** `C:\Users\renan\ond-site` · **Live:** https://ondviajar.com.br (domínio custom via CNAME; o `orenanchaves.github.io/ond-site` redireciona 301 pra cá).

---

## 1. Resumo executivo

O site **evoluiu bastante** desde a análise anterior. O básico "de dentro do `<head>`" foi resolvido em **todas as 5 páginas**: `<title>`, `meta description`, `lang="pt-BR"`, `viewport`, `theme-color` e **favicon** (SVG) estão presentes. A estrutura de headings é limpa (H1 único por página, H2/H3 coerentes), as imagens têm `alt` descritivo, há `lazy-loading`, o site é responsivo e roda em HTTPS. **A base on-page está boa.**

O que **ainda falta é tudo que vive "fora da página" ou que os robôs/redes sociais leem** — e é aqui que está o buraco:

- 🔴 **Nenhuma página tem Open Graph nem Twitter Card** → todo link compartilhado no WhatsApp/Instagram/LinkedIn aparece sem imagem, sem título formatado, feio. Para um produto que se distribui por WhatsApp, isso é o problema #1.
- 🔴 **`sitemap.xml` e `robots.txt` não existem** (confirmado 404 na live) → o Google não tem mapa do site nem instrução de rastreamento.
- 🔴 **Zero structured data (JSON-LD)** → sem Organization, WebSite, SoftwareApplication ou Article. Perde rich results e a chance de o Google "entender" que o OND é um app.
- 🔴 **Blog é conteúdo fantasma:** 1 post real (`post-modelo.html`) e **7 links apontando todos pra ele** — os 6 cards têm títulos/resumos diferentes mas levam ao mesmo artigo. Isso é thin content + links enganosos.
- 🟠 **Canonical ausente** em todas as páginas.
- 🟠 **Imagens do blog pesam 250–493 KB** cada, servidas em thumbs de 170–300px, sem WebP, sem `srcset`, sem `width/height` (risco de CLS).

**Veredito:** on-page ~7/10, técnico ~3/10, conteúdo ~2/10. O site está "publicável" mas **não está pronto pra ranquear nem pra ser compartilhado com boa aparência**. As correções são rápidas e de alto impacto.

---

## 2. Achados por página

| Página | `<title>` (nº chars) | Description | `lang` | Favicon | H1 único | OG / Twitter | Canonical | JSON-LD | Obs. |
|---|---|---|---|---|---|---|---|---|---|
| **index.html** | ✅ "OND vAI — Organize sua viagem" (29) — **curto, sem keyword forte** | ✅ boa | ✅ | ✅ SVG | ✅ | ❌ | ❌ | ❌ | Falta SoftwareApplication + Organization + WebSite |
| **agencias.html** | ✅ "OND para Agências — Roteiros com IA em Minutos" (46) — **ótimo** | ✅ boa, com keyword | ✅ | ✅ SVG | ✅ (1) | ❌ | ❌ | ❌ | Melhor título do site |
| **blog.html** | ✅ "Vai para onde? — Blog do OND" (28) — **brand demais, keyword fraca** | ✅ | ✅ | ✅ SVG | ✅ | ❌ | ❌ | ❌ | Falta Blog/WebSite schema |
| **post-modelo.html** | ✅ "5 destinos no Brasil para fugir do óbvio em 2026 — Vai para onde?" (64) — **ótimo** | ✅ | ✅ | ✅ SVG | ✅ | ❌ | ❌ | ❌ | Headings perfeitos (H1 + 7×H2 + 1×H3), breadcrumb visual. Falta **Article schema** + BreadcrumbList |
| **assessoria.html** | ✅ "Assessoria de Viagem — OND" (26) — **curto** | ✅ boa | ✅ | ✅ SVG | ✅ | ❌ | ❌ | ❌ | Falta Service/Product schema |

**Legenda:** ✅ presente · ❌ ausente.

### Detalhes bons já implementados (não mexer)
- `rel="noopener"` em todos os links externos ✅
- `loading="lazy"` nas imagens (e `eager` na hero, correto) ✅
- `alt` descritivo e útil em todas as imagens (ex.: "Cristo Redentor e Pão de Açúcar vistos do alto, Rio de Janeiro") ✅
- Foco visível de teclado (`:focus-visible`) ✅
- Responsivo com breakpoints em 960px e 600px ✅ (agencias.html corrigido)
- Links internos fortes: nav + footer conectam index ↔ agencias ↔ blog ↔ assessoria ↔ post ✅

---

## 3. Problemas priorizados

### 🔴 Críticos (fazer primeiro — alto impacto, baixo esforço)

**C1. Open Graph e Twitter Card ausentes em todas as páginas**
- **Impacto:** todo link do OND compartilhado (WhatsApp, Instagram, LinkedIn, iMessage) aparece sem imagem e sem título formatado — parece link quebrado/spam. Para um produto que nasce distribuído por WhatsApp, é o dano de imagem mais direto que existe.
- **Correção:** adicionar no `<head>` de cada página:
  ```html
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="OND">
  <meta property="og:title" content="OND vAI — Organize sua viagem com IA">
  <meta property="og:description" content="Roteiro completo em 5 minutos...">
  <meta property="og:url" content="https://ondviajar.com.br/">
  <meta property="og:image" content="https://ondviajar.com.br/assets/og-cover.jpg">
  <meta property="og:locale" content="pt_BR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="...">
  <meta name="twitter:description" content="...">
  <meta name="twitter:image" content="https://ondviajar.com.br/assets/og-cover.jpg">
  ```
- **Pré-requisito:** criar **1 imagem OG 1200×630px** (JPG/PNG, <300KB). No `post-modelo` usar a capa do artigo como `og:image`.

**C2. `robots.txt` e `sitemap.xml` inexistentes** (confirmado: 404 na live)
- **Impacto:** o Google não recebe um mapa das URLs nem instrução de crawl. Sem sitemap, páginas novas (posts futuros) demoram a ser indexadas.
- **Correção:** criar dois arquivos na raiz:
  - `robots.txt`:
    ```
    User-agent: *
    Allow: /
    Sitemap: https://ondviajar.com.br/sitemap.xml
    ```
  - `sitemap.xml` listando as 5 URLs (`/`, `/agencias.html`, `/blog.html`, `/post-modelo.html`, `/assessoria.html`) com `<lastmod>`.
- Depois: registrar o domínio no **Google Search Console** e submeter o sitemap.

**C3. Structured Data (JSON-LD) ausente**
- **Impacto:** o Google não tem sinal explícito de que o OND é um aplicativo, uma empresa, nem que `post-modelo` é um artigo. Perde rich results (estrelas, breadcrumb, logo no Knowledge Panel).
- **Correção — 1 bloco `<script type="application/ld+json">` por tipo:**
  - **index.html:** `Organization` (nome, logo, sameAs redes) + `WebSite` (com `SearchAction` se houver busca) + `SoftwareApplication` (nome OND, categoria TravelApplication, `operatingSystem: "Android, iOS, Web"`, links das stores, `offers` grátis).
  - **post-modelo.html:** `Article` (`headline`, `datePublished` 2026-06-25, `author`, `image`, `publisher`) + `BreadcrumbList`.
  - **agencias.html:** `Service`/`Product` B2B.
  - **assessoria.html:** `Service` (assessoria de viagem, `provider` OND, `areaServed` BR).

**C4. Blog com conteúdo "fantasma" — 1 post real, 7 links pro mesmo arquivo**
- **Impacto:** os 6 cards + 1 destaque em `blog.html` têm títulos e resumos distintos ("Como montar roteiro com IA", "Melhor dia pra comprar passagem", "Lua de mel", "Mochilão América do Sul"...) mas **todos apontam pra `post-modelo.html`** (que fala de destinos no Brasil). É thin content + expectativa quebrada — ruim pra SEO e pior pra confiança do usuário. Um crawler vê 7 promessas de conteúdo e 1 página só.
- **Correção (escolha o caminho):**
  - **Curto prazo (honesto):** deixar só o post que existe e trocar os outros 6 por um estado "em breve" **sem link** (ou remover), até ter conteúdo real.
  - **Médio prazo (certo):** escrever os posts de verdade. O blog é o maior ativo de SEO orgânico do OND — cada post é uma porta de entrada por busca (ver seção 5). Prioridade: os títulos que já existem são ótimas pautas.

### 🟠 Importantes (fazer na sequência)

**I1. Canonical ausente** — adicionar `<link rel="canonical" href="https://ondviajar.com.br/{página}">` em cada página. Barato e evita duplicação (ex.: versão github.io vs domínio custom, query strings).

**I2. Imagens do blog pesadas (250–493 KB) sem otimização**
- 7 imagens somam **~2,6 MB**, servidas em thumbs de 170px (cards) e 300px (featured) e capa do artigo. Peso desproporcional ao tamanho exibido.
- **Correção:** converter pra **WebP** (queda de 60–80% no peso), redimensionar pro tamanho real de exibição, e/ou usar `srcset` + `sizes`. Alvo: <60 KB por thumb. Impacta LCP no mobile.

**I3. `width`/`height` ausentes nas `<img>`** → causa **CLS** (layout shift) enquanto a imagem carrega. Adicionar `width` e `height` (ou `aspect-ratio` no CSS) em todas as imagens de conteúdo.

**I4. Títulos curtos/fracos em keyword** — `index` ("OND vAI — Organize sua viagem", 29 chars) e `blog` ("Vai para onde? — Blog do OND") não usam termos que as pessoas buscam. Reescrever (ver seção 5). O `agencias` e o `post-modelo` já estão bons — usar de modelo.

### 🟡 Desejáveis (polimento)

**D1. Favicon só em SVG** — adicionar fallback `favicon.ico` (32×32) e `apple-touch-icon.png` (180×180) pra Safari/iOS e navegadores antigos.

**D2. `meta robots` explícito** — opcional; o default já é `index,follow`. Adicionar `<meta name="robots" content="index,follow,max-image-preview:large">` ajuda no preview de imagem grande na busca.

**D3. Newsletter não envia pra lugar nenhum** — o form em `blog.html` só mostra "✓ Pronto" via JS, sem backend. Não é SEO, mas é captura de lead perdida; ligar a um serviço (Mailchimp/Buttondown/Formspree).

**D4. Google Fonts render-blocking** — já tem `preconnect` (bom). Opcional: `&display=swap` já está presente ✅; considerar auto-hospedar a fonte Onest pra tirar 1 dependência externa.

**D5. `theme-color` fixo escuro** — o site tem tema claro/escuro, mas `theme-color` está travado em `#0d0d14`. Opcional: usar `media="(prefers-color-scheme: light)"`.

---

## 4. Performance / Core Web Vitals (avaliação básica)

| Item | Estado | Nota |
|---|---|---|
| CSS | ✅ Inline no `<style>` | Bom — sem CSS externo render-blocking (só as fontes + 2 arquivos de tokens) |
| JS | ✅ Pequeno, no fim do `<body>`, sem libs | Ótimo — nada de framework, zero JS de terceiros |
| Imagens (peso) | 🔴 250–493 KB cada, ~2,6 MB no blog | Maior gargalo de LCP no mobile |
| Formato imagens | 🔴 JPG, sem WebP/AVIF | Converter |
| `srcset`/responsive | 🔴 Ausente | Adicionar |
| `width`/`height` | 🟠 Ausente | Risco de CLS |
| Lazy-loading | ✅ Presente | Correto (hero = eager) |
| Fontes | 🟡 Google Fonts externa | Tem preconnect + display=swap ✅ |
| HTTPS | ✅ | OK |
| Mobile-friendly | ✅ | Responsivo, agencias.html corrigido |

**Prioridade de performance:** otimizar as 7 imagens do blog (I2) resolve ~90% do peso da página mais pesada.

---

## 5. Keywords / Oportunidade (pt-BR)

Termos realistas pro OND, mapeados por página que deve atacá-los:

### B2C (viajante) — `index.html` + blog
| Keyword-alvo | Intenção | Dificuldade |
|---|---|---|
| **roteiro de viagem com IA** | comercial | média — nicho novo, pouca concorrência |
| **montar roteiro de viagem** | comercial/informacional | média-alta |
| **roteiro de viagem personalizado** | comercial | média |
| **planejador de viagem** / **app de planejamento de viagem** | comercial | média |
| **como montar um roteiro de viagem** | informacional (blog) | média |
| **assistente de viagem IA** / **concierge de viagem** | comercial | baixa |

→ **Ação no index:** trocar título pra algo como **"OND — Roteiro de viagem com IA em 5 minutos"** e H1 já contém "viajando/planejando" (bom). Reforçar "roteiro de viagem personalizado" no corpo (já aparece bastante — ok).

### B2B (agências/hotéis) — `agencias.html`
| Keyword-alvo | Intenção | Dificuldade |
|---|---|---|
| **software para agência de viagens** | comercial | média |
| **ferramenta de roteiro para agências** | comercial | baixa |
| **roteiro de viagem white label** | comercial | baixa (nicho) |
| **IA para agência de turismo** | comercial | baixa |
| **automação de roteiros turismo** | comercial | baixa |

→ `agencias.html` já ranqueia bem conceitualmente; o título atual é ótimo. Só falta o schema (C3) e OG (C1).

### Blog (tráfego orgânico de topo de funil) — cada post = 1 keyword
Os títulos que **já estão nos cards** são pautas excelentes — basta escrevê-los de verdade:
- "Como montar um roteiro de 7 dias em minutos com IA" → **montar roteiro com IA** ✅
- "O melhor dia da semana para comprar passagem" → **dia mais barato passagem aérea**
- "Mochilão na América do Sul: quanto custa" → **quanto custa mochilão américa do sul**
- "5 destinos no Brasil para fugir do óbvio" (o que existe) → **destinos brasil fora do óbvio 2026**
- "Viajar sozinho pela primeira vez" → **viajar sozinho primeira vez**

→ Cada post real captura busca informacional e leva pro app (CTA "Planejar minha viagem grátis" já existe no post-modelo ✅). **Blog é o motor de aquisição orgânica** — vale investir.

---

## 6. Plano de ação (ordem recomendada)

**Sprint 1 — "não custa quase nada, resolve o compartilhamento e a indexação" (½ dia)**
1. Criar 1 imagem OG 1200×630 (`assets/og-cover.jpg`) + usar a capa do post como OG dele.
2. Adicionar **Open Graph + Twitter Card** nas 5 páginas (C1).
3. Criar **`robots.txt`** e **`sitemap.xml`** na raiz (C2).
4. Adicionar **`canonical`** nas 5 páginas (I1).
5. Registrar `ondviajar.com.br` no **Google Search Console** e submeter o sitemap.

**Sprint 2 — "fazer o Google entender o OND" (½ dia)**
6. Adicionar **JSON-LD**: Organization + WebSite + SoftwareApplication (index), Article + BreadcrumbList (post), Service (agencias, assessoria) — C3.
7. Ajustar **títulos** de index e blog pra incluir keyword (I4).

**Sprint 3 — "resolver o blog" (esforço depende da escolha)**
8. **Decisão de conteúdo (C4):** ou remover/marcar "em breve" os 6 cards falsos agora, **ou** escrever os posts reais. Recomendo: remover os links falsos já (Sprint 1, honestidade) + agendar 1 post real por semana.

**Sprint 4 — "performance" (2–3 h)**
9. Converter as 7 imagens do blog pra **WebP** e redimensionar (I2).
10. Adicionar `width`/`height` nas imagens (I3).

**Polimento (quando sobrar tempo)**
11. Favicon .ico + apple-touch-icon (D1); ligar newsletter a um backend (D3); meta robots max-image-preview (D2).

---

### Uma linha de conclusão
O OND passou de "sem SEO nenhum" pra "base on-page sólida, camada técnica e social ainda vazia". Os itens 🔴 são todos de baixo esforço e alto impacto — dá pra fechar os quatro críticos numa tarde e o site sai de "invisível pro Google e feio no WhatsApp" pra "indexável, compartilhável e entendido como app de viagem com IA".
