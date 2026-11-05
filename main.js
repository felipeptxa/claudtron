/**
 * Cloudtron OneClick — Electron Main Process
 * Author: Felipe Monroe
 * License: MIT
 */

// Prioriza IPv4 para evitar timeouts de DNS/Dual-Stack no Windows
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { app, BrowserWindow, shell, globalShortcut } = require('electron');
const path = require('path');

// 1. Inicializa o servidor proxy local do Cloudtron em segundo plano
require('./server.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Cloudtron OneClick',
    backgroundColor: '#131314',
    autoHideMenuBar: true, // Oculta a barra de menu padrão do Windows
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Carrega a interface servida pelo proxy local
  mainWindow.loadURL('http://localhost:3000');

  // Força links externos a abrirem no navegador padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Atalho F12 para abrir/fechar Console de Desenvolvedor (útil para diagnósticos)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicializa a janela quando o Electron estiver pronto
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Encerra completamente o aplicativo ao fechar a janela no Windows
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
