const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const NVIDIA_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Lê o arquivo .env se existir para pegar a chave automaticamente
let apiKey = process.env.NVIDIA_API_KEY || '';
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val && key.trim() === 'NVIDIA_API_KEY') {
      apiKey = val.join('=').trim();
    }
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Rota de comunicação do Nemotron
  if (req.url === '/api/messages' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const keyToUse = apiKey || payload.apiKey;

        if (!keyToUse) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'NVIDIA API Key não encontrada no arquivo .env' }));
          return;
        }

        const messages = [];
        if (payload.system) {
          messages.push({ role: 'system', content: payload.system });
        }
        (payload.messages || []).forEach(m => {
          messages.push({ role: m.role, content: m.content });
        });

        const nimRequestBody = {
          model: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
          messages: messages,
          max_tokens: payload.max_tokens || 4096,
          temperature: 0.6
        };

        const nimResponse = await fetch(NVIDIA_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`
          },
          body: JSON.stringify(nimRequestBody)
        });

        const data = await nimResponse.json();

        if (!nimResponse.ok) {
          res.writeHead(nimResponse.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
          return;
        }

        const choice = data.choices && data.choices[0];
        const contentText = choice?.message?.content || '';

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          content: [{ type: 'text', text: contentText }],
          stop_reason: choice?.finish_reason === 'length' ? 'max_tokens' : 'end_turn'
        }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Entrega os arquivos estáticos (index.html, ícones, etc.)
  const filePath = req.url === '/' ? path.join(__dirname, 'index.html') : path.join(__dirname, req.url);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado');
    } else {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`CLAUTRON rodando em http://localhost:${PORT}`);
});