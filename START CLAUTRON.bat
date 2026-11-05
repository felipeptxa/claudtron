@echo off
title Cloudtron OneClick Launcher v1.2.1
cd /d "%~dp0"

echo [1/2] Verificando Servidor Cloudtron...
netstat -ano | findstr :3000 >nul
if %errorlevel% neq 0 (
  echo Iniciando Servidor Cloudtron em segundo plano...
  start "Cloudtron-Server" /min cmd /c "node server.js"
  timeout /t 2 /nobreak >nul
) else (
  echo Servidor Cloudtron ja esta ativo e operacional na porta 3000.
)

echo [2/2] Abrindo aplicacao Desktop...
start msedge --app=http://127.0.0.1:3000

exit
