Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Avvio Ndovado - Backend + Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "frontend"

Write-Host "[1/2] Avvio Frontend Angular (porta 4200)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontend'; npm install; npm start"

Write-Host "[2/2] Avvio Backend Spring Boot (porta 8080)..." -ForegroundColor Yellow
Set-Location $root
& .\gradlew.bat bootRun
