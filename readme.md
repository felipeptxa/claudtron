<div align="center">

# ⚡ CLAUTRON OneClick (v1.1.1)
### Desktop Nativo & Web UI para NVIDIA Nemotron 3.5 Super VL 120B

[![Website](https://img.shields.io/badge/%F0%9F%8C%90_Website_Oficial-felipeptxa.github.io%2Fclautron-00F0FF?style=for-the-badge&logo=googlechrome&logoColor=black)](https://felipeptxa.github.io/clautron/)
[![Download Windows](https://img.shields.io/badge/%F0%9F%93%A5_Baixar_Windows_x64-v1.1.0-00FFA3?style=for-the-badge&logo=windows&logoColor=black)](https://github.com/felipeptxa/clautron/releases)
[![Licença MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-7928CA?style=for-the-badge)](LICENSE)

**[👉 Acessar Landing Page Oficial](https://felipeptxa.github.io/clautron/)** • **[📦 Baixar Instalador NSIS](https://github.com/felipeptxa/clautron/releases)** • **[📖 Documentação](#-recursos-principais-v111)**

---

</div>

Aplicativo Desktop nativo para Windows (Electron) e Web UI local projetado para interagir com o modelo multimodal de raciocínio profundo **NVIDIA Nemotron 3.5 Super VL 120B** sem configurações complexas de ambiente.

Distribuição pronta via instalador executável: `CLAUTRON OneClick Setup 1.1.0.exe` (NSIS x64).

---

## 🇧🇷 Português (Brasil)

### ✨ Recursos Principais (v1.1.1)

* 🛡️ **Clautron NeMo Core & Guardrails:**
  * **NeMo Guardrails de Pré-Validação:** Sanitização de caracteres de controle e bytes nulos, e normalização com alternância estrita de papéis no histórico.
  * **NeMo LLM-as-a-Judge em Background:** Avaliação assíncrona não bloqueante de cada resposta com pontuação (1 a 10) e veredito PASS/FAIL gravado em `data/nemo_evals.jsonl`.
  * **Seed Determinística & Modo JSON:** Suporte a seed constante para reprodução exata e formatação `json_object`.
  * **Feedback Humano (👍/👎):** Botões no rodapé para qualificar respostas e reportar motivos específicos em `data/feedback.jsonl`.
* 🤖 **Modo Adaptativo Heurístico ("Automático"):**
  * Detecção instantânea de intenção e modulação dinâmica de temperatura, top-p, tokens e thinking (código, criativo, rápido, profundo).
* ⚙️ **Central de Configurações Globais:**
  * Custom System Prompt permanente, sliders de hiperparâmetros com legendas explicativas e botão de restauração.
* 🟢 **Verificação de Atualizações do GitHub:**
  * Checagem automática e não intrusiva com modal de changelog e botão de download.
* 🔍 **Busca Instantânea no Histórico:**
  * Barra de busca rápida na barra lateral para filtrar conversas salvas em tempo real.
* ⚡ **Smart Auto-Scroll & Telemetria TTFT:**
  * Rolagem inteligente sem travamento ("scroll hijacking"), caixa de pensamento recolhida por padrão e cronômetro de precisão.

* 🖥️ **Aplicativo Desktop Nativo (Windows x64):**
  * Empacotado com **Electron** e **electron-builder** com instalador NSIS completo.
  * Ícone, janela customizada com tema escuro imersivo e sem barras de menu poluídas.
  * Atalho **F12** integrado para depuração e inspeção em tempo real.
* 🧠 **NVIDIA Nemotron 3.5 Super VL 120B:**
  * Conexão direta com o endpoint oficial NVIDIA NIM (`https://integrate.api.nvidia.com/v1/chat/completions`).
  * Suporte nativo a **Chain-of-Thought / Deep Thinking** (`chat_template_kwargs: { "enable_thinking": true }`).
  * Streaming em tempo real via Server-Sent Events (SSE) de baixa latência.
* 🩺 **Botão de Diagnóstico de 2 Passos no Topo:**
  * Checa a comunicação com o servidor local e testa em tempo real se a chave `nvapi-...` está ativa e autorizada.
* 👁️ **Suporte Multimodal Nativo (Visão):**
  * Cole imagens diretamente da área de transferência com **Ctrl + V**.
  * Arraste arquivos de código (`.js`, `.py`, `.html`, `.css`, `.json`, `.csv`, `.md`) e capturas de tela.
  * Formatação automática para o padrão multimodal da NVIDIA (`image_url`).
* 🎛️ **Controle de Esforço / Raciocínio por Conversa:**
  * **Rápido (Low):** Desativa o raciocínio estendido para respostas instantâneas e econômicas.
  * **Médio (Medium):** Equilíbrio técnico ideal para o dia a dia.
  * **Alto (High / CoT):** Orçamento máximo de raciocínio profundo para desafios de arquitetura e lógica.
* ▶️ **Live Sandbox / Visualização Interativa:**
  * Execute códigos HTML5/CSS3/JavaScript gerados pelo modelo dentro da própria interface em sandbox segura.
* 📐 **Interface Otimizada:**
  * Barra lateral retrátil com ajuste de largura manual.
  * Armazenamento local no computador (`localStorage`), exportação em Markdown (`.md`) e renomeação de chats.

---

### 📦 Como Instalar e Rodar

#### Opção 1: Instalador Desktop Windows (Recomendado para usuários finais)
1. Acesse a pasta `dist/` do projeto.
2. Execute o instalador `CLAUTRON OneClick Setup 1.1.0.exe`.
3. Siga o assistente de instalação (ele criará atalho na Área de Trabalho e no Menu Iniciar).
4. Abra o aplicativo, clique em **Chave API** no canto superior direito, insira sua chave da NVIDIA (`nvapi-...`) e comece a conversar!

#### Opção 2: Modo Desenvolvedor (Terminal / Código Fonte)
1. Instale o [Node.js](https://nodejs.org/) (versão 18+).
2. Clone o repositório:
   ```bash
   git clone https://github.com/SEU-USUARIO/clautron.git
   cd clautron
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o aplicativo desktop:
   ```bash
   npm start
   ```
5. Para gerar um novo instalador `.exe`:
   ```bash
   npm run dist
   ```

---

## 🇺🇸 English

### ✨ Key Features (v1.1)

* 🖥️ **Native Desktop App (Windows x64):**
  * Built with **Electron** & **electron-builder** with NSIS installer.
  * Custom dark mode theme, frameless look, zero unnecessary menu bars.
  * Integrated **F12** shortcut for real-time developer inspection.
* 🧠 **NVIDIA Nemotron 3.5 Super VL 120B:**
  * Direct connection to NVIDIA NIM (`https://integrate.api.nvidia.com/v1/chat/completions`).
  * Native **Chain-of-Thought / Deep Thinking** via `chat_template_kwargs: { "enable_thinking": true }`.
  * Real-time Server-Sent Events (SSE) streaming.
* 🩺 **One-Click Diagnostic Button:**
  * Real-time 2-step check: verifies local proxy and validates `nvapi-...` credentials against NVIDIA servers.
* 👁️ **Native Multimodal Support (Vision):**
  * Paste images with **Ctrl + V**.
  * Drag & drop code files and screenshots.
  * Compliant with NVIDIA NIM multimodal payloads.
* 🎛️ **Per-Chat Reasoning Effort Control:**
  * **Low (Fast):** Direct answers without extended thinking.
  * **Medium (Balanced):** Great for general coding and tasks.
  * **High (Deep Thinking / CoT):** Maximum step-by-step reasoning for complex systems.
* ▶️ **Live Sandbox / Web Preview:**
  * Test and run HTML/CSS/JS artifacts directly inside the application.

---

### 📄 License

Distributed under the MIT License. Author: Felipe Monroe.
