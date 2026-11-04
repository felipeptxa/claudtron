#!/usr/bin/env bash

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERRO] Node.js não foi encontrado neste sistema."
    echo "Instale o Node.js a partir de: https://nodejs.org"
    exit 1
fi

# Cria o arquivo .env se não existir
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    echo "[INFO] Arquivo .env gerado a partir de .env.example."
fi

echo "Iniciando o CLAUTRON..."

# Abre a URL automaticamente no navegador padrão conforme o sistema
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" &
elif command -v open &> /dev/null; then
    open "http://localhost:3000" &
fi

# Inicia o servidor Node.js
node server.js