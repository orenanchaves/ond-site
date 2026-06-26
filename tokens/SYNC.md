# OND Design System — tokens vendorizados

Estes CSS são **gerados** pelo design system e **copiados** (vendorizados) para cá.
**NÃO edite à mão** — edite os tokens na fonte e rode o sync.

## Fonte
`C:\_tudo\Agama\OND\ond-design-system` → `build/css/` (gerado por `node scripts/build.mjs`)

## Como atualizar
```powershell
# 1) regerar o build na fonte (se mudou algum token)
cd C:\_tudo\Agama\OND\ond-design-system
node scripts/build.mjs

# 2) copiar para cá
cd C:\Users\renan\ond-site\tokens
./sync.ps1
```

## Como cada página consome
```html
<html lang="pt-BR" data-theme="dark">
...
<link rel="stylesheet" href="tokens/ond-core.css">   <!-- palette + escalas (sempre) -->
<link rel="stylesheet" href="tokens/ond-b2c.css">     <!-- marca: b2c (roxo) OU -->
<link rel="stylesheet" href="tokens/ond-b2b.css">     <!-- marca: b2b (azul) -->
```

Convenção de tema: `:root` = light, `[data-theme="dark"]` = dark.
Os apps são **dark por padrão** → `<html data-theme="dark">`. O toggle alterna
explicitamente entre `data-theme="dark"` e `data-theme="light"`.

## Marca por arquivo (ond-site)
- `index.html`       → B2C (ond-b2c.css)
- `blog.html`        → B2C (ond-b2c.css)
- `post-modelo.html` → B2C (ond-b2c.css)
- `agencias.html`    → B2B (ond-b2b.css)
