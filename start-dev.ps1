# FitMind AI PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting FitMind AI (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; java -jar target/fitmind-backend-1.0.0.jar"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host "`n[OK] Backend and Frontend processes launched!" -ForegroundColor Green
Write-Host "Backend API : http://localhost:8080" -ForegroundColor Yellow
Write-Host "Swagger UI  : http://localhost:8080/swagger-ui.html" -ForegroundColor Yellow
Write-Host "Frontend    : http://localhost:5173" -ForegroundColor Yellow
