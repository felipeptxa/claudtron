/**
 * CLAUTRON OneClick — Local Web UI & Proxy Server (v1.1 Complete)
 * Author: Felipe Monroe
 * License: MIT
 */

// Prioriza IPv4 para evitar travamentos de dual-stack no Windows
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const NVIDIA_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-3.5-super-vl-120b-a12b';

function getEnvApiKey() {
  let key = process.env.NVIDIA_API_KEY || '';
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (k === 'NVIDIA_API_KEY' || k === 'API_KEY') key = v;
      }
    }
  }
  return key;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// ── Utilitário: faz fetch com timeout explícito (ms) ───────────────────────
function fetchWithTimeout(url, options, timeoutMs) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...options, signal: ctrl.signal })
    .finally(() => clearTimeout(tid));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── /api/ping — testa servidor local ──────────────────────────────────────
  if (req.method === 'GET' && req.url === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, model: DEFAULT_MODEL, ts: Date.now() }));
    return;
  }

  // ── /api/test-nvidia — diagnóstico detalhado com a NVIDIA ─────────────────
  if (req.method === 'GET' && req.url.startsWith('/api/test-nvidia')) {
    const authHeader = req.headers['authorization'] || '';
    const clientKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const apiKey = clientKey || getEnvApiKey();

    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: false,
        step: 'auth',
        error: 'Nenhuma chave API configurada. Clique em "Chave API" no topo para colar sua chave.'
      }));
      return;
    }

    (async () => {
      console.log('[DIAGNÓSTICO] Iniciando teste de conexão com NVIDIA...');

      // Passo 1: Testa autenticação e rede via /v1/models (rápido e sem custo de inferência)
      let modelsRes;
      try {
        modelsRes = await fetchWithTimeout('https://integrate.api.nvidia.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'CLAUTRON-OneClick/1.1'
          }
        }, 15000);
      } catch (e) {
        const isTimeout = e.name === 'AbortError';
        console.error('[DIAGNÓSTICO] Falha no Passo 1 (rede):', e.message);
        res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          step: 'network',
          error: isTimeout
            ? 'TIMEOUT DE REDE: Falha ao alcançar integrate.api.nvidia.com em 15s. Verifique firewall, proxy ou internet.'
            : `FALHA DE REDE: ${e.message}`
        }));
        return;
      }

      if (modelsRes.status === 401) {
        console.warn('[DIAGNÓSTICO] Chave rejeitada (401)');
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          step: 'auth',
          error: 'CHAVE INVÁLIDA (401): A chave informada foi recusada pela NVIDIA. Confira se começa com "nvapi-".'
        }));
        return;
      }

      if (!modelsRes.ok) {
        const errText = await modelsRes.text();
        console.warn(`[DIAGNÓSTICO] Erro HTTP ${modelsRes.status}:`, errText);
        res.writeHead(modelsRes.status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          step: 'api_status',
          error: `Erro HTTP ${modelsRes.status} da NVIDIA: ${errText.substring(0, 300)}`
        }));
        return;
      }

      console.log('[DIAGNÓSTICO] Passo 1 OK (chave autenticada). Testando Passo 2 (inferência rápida)...');

      // Passo 2: Teste de inferência mínima (max_tokens: 5, sem stream)
      let testChatRes;
      try {
        testChatRes = await fetchWithTimeout(NVIDIA_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'CLAUTRON-OneClick/1.1'
          },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
            stream: false,
            chat_template_kwargs: { enable_thinking: false }
          })
        }, 25000);
      } catch (e) {
        console.error('[DIAGNÓSTICO] Falha no Passo 2 (inferência):', e.message);
        res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          step: 'model_timeout',
          error: 'Chave autenticada com sucesso, mas o modelo demorou mais de 25s para responder. A NVIDIA pode estar com fila no modelo.'
        }));
        return;
      }

      if (!testChatRes.ok) {
        const chatErr = await testChatRes.text();
        console.warn(`[DIAGNÓSTICO] Erro na inferência (${testChatRes.status}):`, chatErr);
        res.writeHead(testChatRes.status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          step: 'model_error',
          error: `Erro na inferência (${testChatRes.status}): ${chatErr.substring(0, 300)}`
        }));
        return;
      }

      console.log('[DIAGNÓSTICO] Todos os testes passaram com sucesso!');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: true,
        step: 'success',
        message: 'Conexão, chave e modelo NVIDIA 100% operacionais!'
      }));
    })().catch(err => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, step: 'unknown', error: err.message }));
      }
    });
    return;
  }

  // ── /api/messages — proxy principal de chat com streaming ─────────────────
  if (req.method === 'POST' && (req.url === '/api/messages' || req.url === '/api/chat')) {
    let clientKey = '';
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      clientKey = authHeader.slice(7).trim();
    }

    const apiKey = clientKey || getEnvApiKey();

    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Chave não informada. Clique em "Chave API" no topo.' }));
      return;
    }

    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', async () => {
      const startTime = Date.now();
      const abortCtrl = new AbortController();
      let isTimedOut = false;

      // Timeout amplo de 120s para acomodar o início da geração
      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        console.error('[PROXY] ⏱️ Timeout: NVIDIA não respondeu em 120 segundos.');
        abortCtrl.abort();
      }, 120000);

      // Cancela somente se o cliente deliberadamente fechar a conexão de resposta
      res.on('close', () => {
        if (!res.writableEnded) {
          console.warn('[PROXY] Cliente fechou a conexão antes do término.');
          clearTimeout(timeoutId);
          abortCtrl.abort();
        }
      });

      try {
        const clientData = JSON.parse(rawBody || '{}');
        const rawMsgs = Array.isArray(clientData.messages) ? clientData.messages : [];
        const sanitizedMessages = [];

        if (clientData.system) {
          sanitizedMessages.push({ role: 'system', content: clientData.system });
        }

        for (let i = 0; i < rawMsgs.length; i++) {
          const current = rawMsgs[i];
          const prev = sanitizedMessages[sanitizedMessages.length - 1];

          if (prev && prev.role === 'user' && current.role === 'user') {
            const prevText = typeof prev.content === 'string' ? prev.content : JSON.stringify(prev.content);
            const currText = typeof current.content === 'string' ? current.content : JSON.stringify(current.content);
            prev.content = `${prevText}\n\n${currText}`;
          } else {
            sanitizedMessages.push({ role: current.role, content: current.content });
          }
        }

        const isThinking = clientData.effort !== 'low';

        const nvidiaPayload = {
          model: DEFAULT_MODEL,
          messages: sanitizedMessages,
          temperature: 0.6,
          top_p: 0.95,
          max_tokens: clientData.max_tokens || 4096,
          stream: true,
          chat_template_kwargs: { enable_thinking: isThinking }
        };

        console.log(`[PROXY] -> Enviando para NVIDIA (${DEFAULT_MODEL} | thinking: ${isThinking} | tokens: ${nvidiaPayload.max_tokens} | msgs: ${sanitizedMessages.length})...`);

        let nvidiaRes;
        try {
          nvidiaRes = await fetch(NVIDIA_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'User-Agent': 'CLAUTRON-OneClick/1.1'
            },
            body: JSON.stringify(nvidiaPayload),
            signal: abortCtrl.signal
          });
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }

        const elapsedMs = Date.now() - startTime;
        console.log(`[PROXY] <- NVIDIA respondeu com HTTP ${nvidiaRes.status} em ${elapsedMs}ms`);

        if (!nvidiaRes.ok) {
          clearTimeout(timeoutId);
          const errBody = await nvidiaRes.text();
          console.error(`[NVIDIA ${nvidiaRes.status}]:`, errBody);

          let errMsg = `Erro HTTP ${nvidiaRes.status} da NVIDIA`;
          try {
            const parsed = JSON.parse(errBody);
            errMsg = parsed?.detail || parsed?.message || parsed?.error?.message || errMsg;
          } catch (_) {
            if (errBody) errMsg = errBody.substring(0, 300);
          }

          if (!res.headersSent) {
            res.writeHead(nvidiaRes.status, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: errMsg }));
          }
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        });
        res.flushHeaders();

        let chunkCount = 0;
        try {
          for await (const chunk of nvidiaRes.body) {
            chunkCount++;
            if (chunkCount === 1) {
              const firstChunkTime = Date.now() - startTime;
              console.log(`[PROXY] ⚡ Primeiro chunk de streaming recebido em ${firstChunkTime}ms!`);
            }
            if (!res.writableEnded) res.write(chunk);
          }
        } catch (streamErr) {
          if (streamErr.name !== 'AbortError') {
            console.error('[ERRO STREAM]:', streamErr.message);
            if (!res.writableEnded) {
              const safeMsg = streamErr.message.replace(/"/g, "'");
              res.write(`data: {"__clautron_error":"${safeMsg}"}\n\n`);
            }
          }
        } finally {
          clearTimeout(timeoutId);
          console.log(`[PROXY] Streaming concluído (${chunkCount} chunks enviados).`);
        }

        if (!res.writableEnded) res.end();

      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          if (isTimedOut) {
            console.error('[PROXY] ⏱️ Requisição abortada por timeout de 120s.');
            if (!res.headersSent) {
              res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ error: 'Timeout: a NVIDIA não retornou resposta em 120 segundos.' }));
            } else if (!res.writableEnded) {
              res.write(`data: {"__clautron_error":"Timeout: sem resposta da NVIDIA."}\n\n`);
              res.end();
            }
          } else {
            console.warn('[PROXY] Requisição cancelada pelo usuário.');
            if (!res.headersSent) {
              res.writeHead(499, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ error: 'Cancelado pelo usuário.' }));
            } else if (!res.writableEnded) {
              res.end();
            }
          }
          return;
        }

        console.error('[ERRO PROXY]:', err.message);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: err.message }));
        } else if (!res.writableEnded) {
          const safeMsg = err.message.replace(/"/g, "'");
          res.write(`data: {"__clautron_error":"${safeMsg}"}\n\n`);
          res.end();
        }
      }
    });
    return;
  }

  // ── Servidor de Arquivos Estáticos ─────────────────────────────────────────
  let safePath = req.url === '/' ? '/index.html' : req.url;
  safePath = path.normalize(safePath).replace(/^(\.\.[\\/])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallbackIndex = path.join(__dirname, 'index.html');
      fs.readFile(fallbackIndex, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` ⚡ CLAUTRON OneClick - Local Server Ativo`);
  console.log(` 🚀 Interface: http://localhost:${PORT}`);
  console.log(` 📡 Streaming de Baixa Latência Ativo`);
  console.log(` 🧠 Modelo: ${DEFAULT_MODEL}`);
  console.log(`===============================================`);
});
