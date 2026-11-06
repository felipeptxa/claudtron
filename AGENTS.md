# Diretrizes do Projeto Cloudtron OneClick

1. Arquitetura e Portas:
   - Servidor HTTP nativo Node.js na porta 3000 em 127.0.0.1.
   - Electron em main.js comunicando com http://127.0.0.1:3000.
   - Qualquer fallback de porta em server.js deve manter main.js sincronizado.

2. Segurança e Estabilidade:
   - Limitar payloads a 50 MB em /api/parse-file e /api/messages.
   - Sempre checar res.headersSent antes de invocar res.end() ou res.write().
   - Nunca usar bind aberto em 0.0.0.0; sempre '127.0.0.1'.

3. Qualidade:
   - Todo refactor DEVE passar na suíte test/suite.js (npm test) com 19/19 checks.
