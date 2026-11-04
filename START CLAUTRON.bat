@echo off
title Nemotron Local Launcher
cd /d "%~dp0"

echo [1/3] Iniciando Proxy fcc-server...
start "Nemotron-Proxy" /min cmd /c "uvx --from free-claude-code fcc-server"

echo [2/3] Aguardando conexao do proxy...
timeout /t 3 /nobreak >nul

echo [3/3] Iniciando Web Server...
start "Nemotron-Server" /min cmd /c "node server.js"

timeout /t 2 /nobreak >nul

echo Abrindo aplicacao...
start msedge --app=http://127.0.0.1:3000

exit