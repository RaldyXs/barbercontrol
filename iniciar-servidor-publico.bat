@echo off
title BarberControl RD - Servidor Publico
color 0A
echo ===================================================
echo   💈 BARBERCONTROL RD - SERVIDOR PUBLICO ACTIVO 💈
echo ===================================================
echo.
echo Iniciando servidor Node.js y Tunel Cloudflare...
echo.

start "BarberControl Server" /B node server.js
timeout /t 2 /nobreak >nul
start "BarberControl Tunel" /B bin\cloudflared.exe tunnel --url http://localhost:3000

echo.
echo Servidor en ejecucion. No cierres esta ventana mientras el barbero use la app.
echo ===================================================
pause
