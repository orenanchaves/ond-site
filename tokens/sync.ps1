# Sincroniza os CSS de tokens a partir do build do design system.
# Uso:  ./sync.ps1
$ErrorActionPreference = "Stop"
$src = "C:\_tudo\Agama\OND\ond-design-system\build\css"
$dst = $PSScriptRoot
if (-not (Test-Path $src)) { throw "Build nao encontrado em $src. Rode 'node scripts/build.mjs' no ond-design-system." }
foreach ($f in @("ond-core.css","ond-b2c.css","ond-b2b.css")) {
  Copy-Item -Path (Join-Path $src $f) -Destination (Join-Path $dst $f) -Force
  Write-Host "ok  $f"
}
Write-Host "Tokens sincronizados de $src"
