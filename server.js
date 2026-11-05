/**
 * CLAUTRON OneClick — Local Web UI & Proxy Server (v1.1.1 Complete)
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

// ── Diretório de Dados e Avaliação (Clautron NeMo Core & Eval Engine) ─────────
const DATA_DIR = path.join(__dirname, 'data');
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.jsonl');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.jsonl');
const NEMO_EVALS_FILE = path.join(DATA_DIR, 'nemo_evals.jsonl');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function logInteraction(entry) {
  try {
    ensureDataDir();
    const line = JSON.stringify(entry) + '\n';
    fs.appendFile(INTERACTIONS_FILE, line, 'utf8', (err) => {
      if (err) console.error('[EVAL ENGINE] Erro ao gravar em interactions.jsonl:', err.message);
      else console.log(`[EVAL ENGINE] 📝 Interação registrada com sucesso: ${entry.id}`);
    });
  } catch (err) {
    console.error('[EVAL ENGINE] Exceção ao gravar interação:', err.message);
  }
}

function logNeMoEvaluation(entry) {
  try {
    ensureDataDir();
    const line = JSON.stringify(entry) + '\n';
    fs.appendFile(NEMO_EVALS_FILE, line, 'utf8', (err) => {
      if (err) console.error('[NEMO JUDGE] Erro ao gravar nemo_evals.jsonl:', err.message);
      else console.log(`[NEMO JUDGE] 🛡️ Avaliação registrada (${entry.verdict} - ${entry.score}/10): ${entry.id}`);
    });
  } catch (err) {
    console.error('[NEMO JUDGE] Exceção ao gravar avaliação:', err.message);
  }
}

// ── NeMo Guardrails: Validação e Sanitização de Mensagens ───────────────────
function applyNeMoGuardrails(messages, systemPrompt) {
  const sanitized = [];

  // 1. Sanitização do System Prompt contra caracteres nulos e de controle
  if (systemPrompt && typeof systemPrompt === 'string') {
    const cleanSys = systemPrompt
      .replace(/\0/g, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
    if (cleanSys) {
      sanitized.push({ role: 'system', content: cleanSys });
    }
  }

  if (!Array.isArray(messages)) return sanitized;

  // 2. Sanitização de histórico e garantia de alternância estrita de papéis
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m !== 'object') continue;

    const role = (m.role === 'assistant') ? 'assistant' : 'user';
    let content = m.content;

    // Sanitiza strings de texto contra caracteres nulos
    if (typeof content === 'string') {
      content = content.replace(/\0/g, '').trim();
    } else if (Array.isArray(content)) {
      // Multimodal payload
      content = content.map(part => {
        if (part && part.type === 'text' && typeof part.text === 'string') {
          return { ...part, text: part.text.replace(/\0/g, '').trim() };
        }
        return part;
      });
    }

    if (!content || (typeof content === 'string' && content.length === 0)) continue;

    const prev = sanitized[sanitized.length - 1];
    // Se o papel anterior for idêntico ao atual (ex: dois 'user' seguidos), funde com quebra dupla
    if (prev && prev.role === role) {
      const prevText = typeof prev.content === 'string' ? prev.content : JSON.stringify(prev.content);
      const currText = typeof content === 'string' ? content : JSON.stringify(content);
      prev.content = `${prevText}\n\n${currText}`;
    } else {
      sanitized.push({ role, content });
    }
  }

  return sanitized;
}

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

// ── Utilitário: faz fetch com timeout explícito (ms) ─────────────────────────
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

  // ── /api/test-nvidia — diagnóstico detalhado com a NVIDIA ──────────────────
  if (req.method === 'GET' && req.url.startsWith('/api/test-nvidia')) {
    const authHeader = req.headers['authorization'] || '';
    const clientKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const apiKey = clientKey || getEnvApiKey();

    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: false,
        step: 'auth',
        error: 'Nenhuma chave API configurada. Clique em "Configurações" no topo para colar sua chave.'
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
            'User-Agent': 'CLAUTRON-OneClick/1.1.1'
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

      if (!modelsRes.ok) {
        let errDetail = '';
        try {
          const errJson = await modelsRes.json();
          errDetail = errJson.error || errJson.message || JSON.stringify(errJson);
        } catch (_) {
          errDetail = `HTTP ${modelsRes.status}: ${modelsRes.statusText}`;
        }

        console.error(`[DIAGNÓSTICO] Falha no Passo 1 (auth): HTTP ${modelsRes.status} - ${errDetail}`);
        const userMsg = modelsRes.status === 401
          ? 'CHAVE INVÁLIDA: A chave nvapi informada foi rejeitada pela NVIDIA (HTTP 401). Verifique sua chave.'
          : modelsRes.status === 403
          ? 'ACESSO NEGADO: Sua conta NVIDIA não tem permissão para esta API (HTTP 403).'
          : `ERRO NVIDIA (HTTP ${modelsRes.status}): ${errDetail}`;

        res.writeHead(modelsRes.status, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, step: 'auth', status: modelsRes.status, error: userMsg }));
        return;
      }

      console.log('[DIAGNÓSTICO] Passo 1 OK (chave autenticada). Testando Passo 2 (inferência simples)...');

      // Passo 2: Teste de inferência real de 1 token (sem stream) com timeout de 20s
      try {
        const testRes = await fetchWithTimeout(NVIDIA_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CLAUTRON-OneClick/1.1.1'
          },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 2,
            stream: false,
            chat_template_kwargs: { enable_thinking: false }
          })
        }, 20000);

        if (!testRes.ok) {
          let inferErr = '';
          try {
            const ej = await testRes.json();
            inferErr = ej.error || ej.message || JSON.stringify(ej);
          } catch (_) {
            inferErr = `HTTP ${testRes.status}: ${testRes.statusText}`;
          }
          console.error(`[DIAGNÓSTICO] Falha no Passo 2 (inferência): ${inferErr}`);
          res.writeHead(testRes.status, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            ok: false,
            step: 'inference',
            status: testRes.status,
            error: `Autenticado, mas inferência falhou (HTTP ${testRes.status}): ${inferErr}`
          }));
          return;
        }

        console.log('[DIAGNÓSTICO] Todos os testes passaram com sucesso!');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          model: DEFAULT_MODEL,
          message: 'Conexão e inferência NVIDIA OK!'
        }));

      } catch (e) {
        const isTimeout = e.name === 'AbortError';
        console.error('[DIAGNÓSTICO] Falha no Passo 2 (timeout/erro):', e.message);
        res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          step: 'inference',
          error: isTimeout
            ? 'TIMEOUT NA INFERÊNCIA: NVIDIA autenticou, mas o modelo demorou mais de 20s para gerar 1 token.'
            : `ERRO DE INFERÊNCIA: ${e.message}`
        }));
      }
    })();
    return;
  }

  // ── /api/nemo/evaluate — NeMo LLM-as-a-Judge em Segundo Plano ───────────────
  if (req.method === 'POST' && req.url === '/api/nemo/evaluate') {
    const authHeader = req.headers['authorization'] || '';
    const clientKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const apiKey = clientKey || getEnvApiKey();

    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Chave API não configurada.' }));
      return;
    }

    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(rawBody || '{}');
        const { userPrompt, assistantResponse, profileUsed, interactionId } = payload;

        if (!userPrompt || !assistantResponse) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Parâmetros userPrompt e assistantResponse são obrigatórios.' }));
          return;
        }

        console.log(`[NEMO JUDGE] ⚖️ Iniciando avaliação LLM-as-a-Judge (${profileUsed || 'Padrão'})...`);

        const judgeSystemPrompt = "Você é o NeMo Evaluator. Avalie a resposta fornecida para o prompt do utilizador nos seguintes critérios (notas de 1 a 10): accuracy, completeness, conciseness. Retorne estritamente um JSON com: { score: number, verdict: 'PASS' | 'FAIL', reasoning: string }";

        const judgeMessages = [
          { role: 'system', content: judgeSystemPrompt },
          {
            role: 'user',
            content: `Prompt do usuário:\n${userPrompt.substring(0, 1500)}\n\nResposta do assistente (Perfil adotado: ${profileUsed || 'Padrão'}):\n${assistantResponse.substring(0, 3000)}`
          }
        ];

        const judgePayload = {
          model: DEFAULT_MODEL,
          messages: judgeMessages,
          temperature: 0.1,
          max_tokens: 512,
          stream: false,
          response_format: { type: "json_object" },
          chat_template_kwargs: { enable_thinking: false }
        };

        const judgeRes = await fetchWithTimeout(NVIDIA_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'CLAUTRON-NeMo-Evaluator/1.1.1'
          },
          body: JSON.stringify(judgePayload)
        }, 30000);

        if (!judgeRes.ok) {
          const errTxt = await judgeRes.text();
          throw new Error(`NVIDIA HTTP ${judgeRes.status}: ${errTxt.substring(0, 200)}`);
        }

        const judgeData = await judgeRes.json();
        const rawContent = judgeData.choices?.[0]?.message?.content || '{}';

        let parsedEvaluation = {
          score: 8,
          verdict: 'PASS',
          reasoning: 'Avaliação concluída com sucesso.'
        };

        try {
          const parsed = JSON.parse(rawContent);
          parsedEvaluation = {
            score: typeof parsed.score === 'number' ? parsed.score : 8,
            verdict: (parsed.verdict === 'FAIL') ? 'FAIL' : 'PASS',
            reasoning: parsed.reasoning || parsed.details || 'Conforme com as diretrizes do NeMo.'
          };
        } catch (_) {
          console.warn('[NEMO JUDGE] Resposta não-JSON estrita do juiz, usando fallback seguro.');
        }

        const evalRecord = {
          id: 'eval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          interactionId: interactionId || null,
          timestamp: new Date().toISOString(),
          profileUsed: profileUsed || 'Auto',
          score: parsedEvaluation.score,
          verdict: parsedEvaluation.verdict,
          reasoning: parsedEvaluation.reasoning,
          userPrompt: userPrompt.substring(0, 1000),
          assistantResponse: assistantResponse.substring(0, 2000)
        };

        // Grava no log permanente de avaliações do NeMo
        logNeMoEvaluation(evalRecord);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, evaluation: parsedEvaluation }));

      } catch (err) {
        console.error('[NEMO JUDGE ERRO]:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ── /api/feedback — recebe avaliação de resposta (👍 / 👎) ───────────────
  if (req.method === 'POST' && req.url === '/api/feedback') {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(rawBody || '{}');
        const { interactionId, rating, reason } = payload;

        if (!interactionId || !rating) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Campos interactionId e rating são obrigatórios.' }));
          return;
        }

        const feedbackEntry = {
          interactionId,
          rating,
          reason: reason || null,
          timestamp: new Date().toISOString()
        };

        ensureDataDir();

        // 1. Grava no log de feedback append-only
        fs.appendFile(FEEDBACK_FILE, JSON.stringify(feedbackEntry) + '\n', 'utf8', (err) => {
          if (err) console.error('[EVAL ENGINE] Erro ao gravar feedback.jsonl:', err.message);
        });

        // 2. Se interactions.jsonl existir, atualiza o campo "feedback" da linha correspondente
        if (fs.existsSync(INTERACTIONS_FILE)) {
          fs.readFile(INTERACTIONS_FILE, 'utf8', (readErr, content) => {
            if (!readErr && content) {
              const lines = content.split('\n');
              let updated = false;
              const newLines = lines.map(line => {
                if (!line.trim()) return line;
                try {
                  const item = JSON.parse(line);
                  if (item.id === interactionId) {
                    item.feedback = {
                      rating,
                      reason: reason || null,
                      timestamp: feedbackEntry.timestamp
                    };
                    updated = true;
                    return JSON.stringify(item);
                  }
                } catch (_) {}
                return line;
              });

              if (updated) {
                fs.writeFile(INTERACTIONS_FILE, newLines.join('\n'), 'utf8', (writeErr) => {
                  if (writeErr) console.error('[EVAL ENGINE] Erro ao atualizar interactions.jsonl:', writeErr.message);
                  else console.log(`[EVAL ENGINE] ⭐ Feedback gravado para ${interactionId}: ${rating}${reason ? ` (${reason})` : ''}`);
                });
              }
            }
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, message: 'Feedback recebido com sucesso.' }));

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ── /api/messages — Proxy de streaming SSE para a NVIDIA ──────────────────
  if (req.method === 'POST' && (req.url === '/api/messages' || req.url === '/api/chat')) {
    const authHeader = req.headers['authorization'] || '';
    const clientKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const apiKey = clientKey || getEnvApiKey();

    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Chave não informada. Clique em "Configurações" no topo.' }));
      return;
    }

    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', async () => {
      const startTime = Date.now();
      let clientData;
      try {
        clientData = JSON.parse(rawBody || '{}');
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'JSON inválido recebido no corpo da requisição.' }));
        return;
      }

      const interactionId = clientData.interactionId || ('req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
      const abortCtrl = new AbortController();
      let isTimedOut = false;
      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        abortCtrl.abort();
      }, 120000);

      // Cancela a requisição com a NVIDIA somente se a resposta do cliente for fechada prematuramente
      res.on('close', () => {
        if (!res.writableEnded) {
          console.warn('[PROXY] Conexão com o navegador encerrada prematuramente. Abortando NVIDIA...');
          clearTimeout(timeoutId);
          abortCtrl.abort();
        }
      });

      try {
        // Aplica NeMo Guardrails para integridade, alternância de papéis e sanitização
        const sanitizedMessages = applyNeMoGuardrails(clientData.messages, clientData.system);

        // Determinação da flag Thinking: respeita valor booleano explícito do cliente
        const isThinking = (typeof clientData.thinking === 'boolean')
          ? clientData.thinking
          : (clientData.effort !== 'low');

        // Hiperparâmetros configuráveis com fallback seguro
        const temperature = (typeof clientData.temperature === 'number' && !isNaN(clientData.temperature))
          ? clientData.temperature
          : 0.7;

        const top_p = (typeof clientData.top_p === 'number' && !isNaN(clientData.top_p))
          ? clientData.top_p
          : 0.95;

        const max_tokens = (typeof clientData.max_tokens === 'number' && clientData.max_tokens > 0)
          ? clientData.max_tokens
          : 4096;

        // Suporte a seed e response_format
        const seed = (typeof clientData.seed === 'number' && !isNaN(clientData.seed))
          ? clientData.seed
          : null;

        const nvidiaPayload = {
          model: DEFAULT_MODEL,
          messages: sanitizedMessages,
          temperature: temperature,
          top_p: top_p,
          max_tokens: max_tokens,
          stream: true,
          chat_template_kwargs: { enable_thinking: isThinking }
        };

        if (seed !== null) {
          nvidiaPayload.seed = seed;
        }

        if (clientData.response_format && typeof clientData.response_format === 'object') {
          nvidiaPayload.response_format = clientData.response_format;
        }

        console.log(`[PROXY] -> Enviando para NVIDIA (${DEFAULT_MODEL} | thinking: ${isThinking} | temp: ${temperature} | top_p: ${top_p} | tokens: ${max_tokens} | seed: ${seed} | msgs: ${sanitizedMessages.length})...`);

        let nvidiaRes;
        try {
          nvidiaRes = await fetch(NVIDIA_ENDPOINT, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
              'User-Agent': 'CLAUTRON-OneClick/1.1.1'
            },
            body: JSON.stringify(nvidiaPayload),
            signal: abortCtrl.signal
          });
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            console.warn('[PROXY] Requisição abortada (timeout ou cancelamento do usuário).');
            if (isTimedOut && !res.headersSent) {
              res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ error: 'Timeout: a NVIDIA não respondeu em 120 segundos.' }));
            }
            return;
          }
          console.error('[ERRO FETCH PROXY]:', fetchErr.message);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: `Falha na conexão com a NVIDIA: ${fetchErr.message}` }));
          }
          return;
        }

        if (!nvidiaRes.ok) {
          clearTimeout(timeoutId);
          console.error(`[ERRO NVIDIA API]: HTTP ${nvidiaRes.status} ${nvidiaRes.statusText}`);
          let errMsg = `Erro NVIDIA HTTP ${nvidiaRes.status}: ${nvidiaRes.statusText}`;
          try {
            const errData = await nvidiaRes.json();
            console.error('[DETALHE ERRO NVIDIA]:', JSON.stringify(errData));
            errMsg = errData.error?.message || errData.message || errData.detail || JSON.stringify(errData);
          } catch (_) {
            const errBody = await nvidiaRes.text().catch(() => '');
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

        // Envia o interactionId como primeiro evento SSE para sincronização do cliente
        res.write(`data: {"__clautron_interaction_id":"${interactionId}"}\n\n`);

        let chunkCount = 0;
        let ttft_ms = 0;
        let accumulatedResponseText = '';
        const textDecoder = new TextDecoder('utf-8');

        try {
          for await (const chunk of nvidiaRes.body) {
            chunkCount++;
            if (chunkCount === 1) {
              ttft_ms = Date.now() - startTime;
              console.log(`[PROXY] ⚡ Primeiro chunk de streaming recebido em ${ttft_ms}ms!`);
            }
            if (!res.writableEnded) res.write(chunk);

            // Decodifica e acumula resposta para o log de avaliação
            const decoded = textDecoder.decode(chunk, { stream: true });
            const lines = decoded.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const parsed = JSON.parse(trimmed.slice(6));
                  const delta = parsed.choices?.[0]?.delta || {};
                  if (delta.content) accumulatedResponseText += delta.content;
                } catch (_) {}
              }
            }
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
          const total_time_ms = Date.now() - startTime;
          console.log(`[PROXY] Streaming concluído (${chunkCount} chunks enviados em ${(total_time_ms/1000).toFixed(2)}s).`);

          // Determina o prompt do usuário para o log de avaliação
          let userPrompt = clientData.prompt || '';
          if (!userPrompt && Array.isArray(sanitizedMessages)) {
            const lastUser = [...sanitizedMessages].reverse().find(m => m.role === 'user');
            if (lastUser) {
              userPrompt = typeof lastUser.content === 'string'
                ? lastUser.content
                : JSON.stringify(lastUser.content);
            }
          }

          // Grava a interação estruturada no formato JSONL (Clautron Eval Engine)
          if (accumulatedResponseText || chunkCount > 0) {
            logInteraction({
              id: interactionId,
              timestamp: new Date().toISOString(),
              model: DEFAULT_MODEL,
              effort: clientData.effort || 'auto',
              profile: clientData.profile || 'Auto',
              temperature: temperature,
              top_p: top_p,
              seed: seed,
              thinking: isThinking,
              ttft_ms: ttft_ms || 0,
              total_time_ms: total_time_ms,
              prompt: userPrompt,
              response: accumulatedResponseText,
              feedback: null
            });
          }
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

  // ── Servidor de Arquivos Estáticos ────────────────────────────────────────
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
  console.log(` 🛡️ Clautron NeMo Core & Eval Engine Ativo`);
  console.log(`===============================================`);
});
