@echo off
title Cloudtron OneClick Launcher
cd /d "%~dp0"

echo [1/2] Iniciando Servidor Cloudtron...
start "Cloudtron-Server" /min cmd /c "node server.js"

timeout /t 2 /nobreak >nul

echo [2/2] Abrindo aplicacao Desktop...
start msedge --app=http://127.0.0.1:3000

exit
