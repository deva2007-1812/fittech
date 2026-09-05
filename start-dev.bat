@echo off
title FitMind AI Launcher
echo ========================================================
echo   Starting FitMind AI (Backend + Frontend)
echo ========================================================
echo.
start "FitMind AI - Backend (Port 8080)" cmd /k "cd /d %~dp0backend && java -jar target/fitmind-backend-1.0.0.jar"
start "FitMind AI - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo [OK] Backend and Frontend processes launched!
echo.
echo Backend API : http://localhost:8080
echo Swagger UI  : http://localhost:8080/swagger-ui.html
echo Frontend    : http://localhost:5173
echo.
