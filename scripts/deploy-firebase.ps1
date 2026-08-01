# Despliega reglas Firestore + Storage (+ Hosting opcional)
# Uso: powershell -ExecutionPolicy Bypass -File scripts/deploy-firebase.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host ">> Login Firebase (si hace falta)..." -ForegroundColor Cyan
npx firebase login --reauth 2>$null
npx firebase use casa-a0dfc

Write-Host ">> Desplegando reglas Firestore y Storage..." -ForegroundColor Cyan
npx firebase deploy --only firestore:rules,storage

Write-Host ">> Listo. Ahora la app puede leer/escribir con usuarios autenticados." -ForegroundColor Green
