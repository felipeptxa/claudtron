# ⚡ CLAUTRON — Local Web UI & Proxy

A modern, fast, and responsive web interface designed to integrate the Claude API ecosystem with NVIDIA NIM's **Nemotron 3.5 Super VL 120B** multimodal reasoning model.

Zero external package dependencies (no `npm install` required): plug and play.

---

## 🇺🇸 English

### ✨ Features

* 🚀 **1-Click Launch:** Instantly start the local server and open the browser via `START CLAUTRON.bat` (Windows) or `./run.sh` (Linux/macOS).
* 👁️ **Native Multimodal Support (Vision):**
* Paste images and screenshots directly from the clipboard with **Ctrl + V**.
* Drag and drop code files (`.js`, `.py`, `.html`, `.css`, `.json`, `.csv`, `.md`) and images directly into the prompt box.
* Image thumbnail previews and file badges with individual remove buttons (`✕`) before sending.


* 🎛️ **Per-Session Effort Control (Memory):**
* **Low (Fast):** Disables extended reasoning for quick, token-efficient, concise answers.
* **Medium (Balanced):** Balanced technical output for everyday tasks.
* **High (Deep Thinking / CoT):** Allocates full reasoning budget for complex architectural and algorithmic problems.


* ▶️ **Live Sandbox / Web Preview:** Execute and preview complete HTML/CSS/JS applications rendered by the model with a single click.
* 📐 **Ergonomic Dark UI:**
* Compact code blocks (max 280px) with smooth *Expand / Collapse* toggling.
* Resizable sidebar with drag-to-resize handles.
* 100% client-side storage (`localStorage`) with chat renaming, message inspection, and Markdown export (`.md`).
* Subtle 6px scrollbars integrated into the dark theme.



---

### 🛠️ How to Run

#### Prerequisites

* [Node.js](https://nodejs.org/) installed.
* Free API Key from [NVIDIA NIM](https://build.nvidia.com).

#### Setup & Execution

1. Clone the repository or download the ZIP:
```bash
git clone https://github.com/SEU-USUARIO/clautron.git
cd clautron

```


2. Configure your API key:
* Duplicate `.env.example` and rename it to `.env`.
* Insert your NVIDIA NIM API key:
```env
NVIDIA_API_KEY=nvapi-your-key-here
PORT=3000

```




3. Launch the app:
* **Windows:** Double-click `START CLAUTRON.bat`
* **Linux / macOS:** Run `./run.sh` or `node server.js`



Access in your browser: **`http://localhost:3000`**

---

### 🔒 Privacy & Security

The `.env` file containing your personal API key is excluded from Git tracking via `.gitignore`. Never commit or share your private API keys.

---

### 📄 License

Distributed under the MIT License. Feel free to use, modify, and contribute!

---

## 🇧🇷 Português (Brasil)

### ✨ Recursos

* 🚀 **Inicialização em 1 Clique:** Inicie o servidor local e abra o navegador instantaneamente pelo `START CLAUTRON.bat` (Windows) ou `./run.sh` (Linux/macOS).
* 👁️ **Suporte Multimodal Nativo (Visão Computacional):**
* Cole imagens e prints diretamente da área de transferência com **Ctrl + V**.
* Arraste e solte arquivos de código (`.js`, `.py`, `.html`, `.css`, `.json`, `.csv`, `.md`) e capturas de tela diretamente na caixa de entrada.
* Pré-visualização com miniaturas de imagens e tags de arquivos com botão individual de exclusão (`✕`) antes do envio.


* 🎛️ **Controle de Effort por Conversa (Memória de Sessão):**
* **Rápido (Low):** Desativa o raciocínio estendido para respostas instantâneas, objetivas e econômicas em tokens.
* **Médio (Medium):** Equilíbrio técnico ideal para tarefas diárias e desenvolvimento contínuo.
* **Alto (High / CoT):** Aciona orçamento total de raciocínio passo a passo (*Chain of Thought*) para lógica e arquitetura complexa.


* ▶️ **Live Sandbox / Visualização ao Vivo:** Execute e teste códigos HTML/CSS/JS completos gerados pelo modelo dentro da interface com um único clique.
* 📐 **Interface Fluida e Otimizada (Tema Escuro):**
* Janelas de código compactas (máx. 280px) com botão nativo para alternar entre *Expandir / Recolher*.
* Barra lateral retrátil com ajuste de largura por arraste.
* Armazenamento 100% local no navegador (`localStorage`) com suporte a renomeação, inspeção e exportação de conversas em Markdown (`.md`).
* Barras de rolagem discretas de 6px integradas ao tema visual escuro.



---

### 🛠️ Como Executar

#### Pré-requisitos

* [Node.js](https://nodejs.org/) instalado no computador.
* Chave de API gratuita do [NVIDIA NIM](https://build.nvidia.com).

#### Instalação e Execução

1. Clone o repositório ou baixe o arquivo ZIP:
```bash
git clone https://github.com/SEU-USUARIO/clautron.git
cd clautron

```


2. Configure sua chave de API:
* Duplique o arquivo `.env.example` e renomeie para `.env`.
* Adicione sua chave gerada no portal da NVIDIA:
```env
NVIDIA_API_KEY=nvapi-sua-chave-aqui
PORT=3000

```




3. Inicie o CLAUTRON:
* **No Windows:** Dê duplo clique em `START CLAUTRON.bat`
* **No Linux / macOS:** Execute `./run.sh` ou `node server.js`



A interface abrirá automaticamente no navegador em: **`http://localhost:3000`**

---

### 🔒 Privacidade e Segurança

O arquivo `.env` com a sua chave pessoal não é versionado no Git graças ao arquivo `.gitignore` já pré-configurado no projeto. Nunca compartilhe suas credenciais públicas.

---

### 📄 Licença

Distribuído sob a licença MIT. Sinta-se livre para usar, estudar, modificar e compartilhar!