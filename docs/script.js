/**
 * Cloudtron OneClick - Interactive Scripts v1.2.0
 * Zero dependencies, vanilla JS, high performance.
 */

document.addEventListener('DOMContentLoaded', () => {
  initThinkingToggle();
  initMockupTabs();
  initPresetChips();
  initDiagnosticSimulator();
  initCopyButtons();
  initDownloadFeedback();
  initCardMouseGlow();
  initMobileMenu();
  initBackToTop();
  initInteractiveSandbox();
});

/**
 * 1. Collapsible Thinking Box (<thinking>)
 * Micro-interação no cabeçalho roxo com animação suave de chevron e altura
 */
function initThinkingToggle() {
  const thinkingBox = document.getElementById('thinkingBox');
  const thinkingHeader = document.getElementById('thinkingHeader');

  if (thinkingBox && thinkingHeader) {
    thinkingHeader.addEventListener('click', () => {
      const isExpanded = thinkingBox.classList.toggle('expanded');
      thinkingHeader.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
  }
}

/**
 * 2. Mockup View Tabs (Chat & Código vs Live Sandbox Preview)
 * Alternância suave entre visualização de chat/código e renderização ao vivo do componente
 */
function initMockupTabs() {
  const tabChat = document.getElementById('tabChat');
  const tabSandbox = document.getElementById('tabSandbox');
  const chatMessages = document.getElementById('mockupChatMessages');
  const chatInputBar = document.getElementById('mockupInputBar');
  const sandboxView = document.getElementById('mockupSandboxView');

  if (tabChat && tabSandbox && chatMessages && sandboxView) {
    tabChat.addEventListener('click', () => {
      tabChat.classList.add('active');
      tabSandbox.classList.remove('active');
      tabChat.setAttribute('aria-selected', 'true');
      tabSandbox.setAttribute('aria-selected', 'false');
      
      chatMessages.classList.remove('hidden-view');
      if (chatInputBar) chatInputBar.classList.remove('hidden-view');
      sandboxView.classList.remove('active-view');
    });

    tabSandbox.addEventListener('click', () => {
      tabSandbox.classList.add('active');
      tabChat.classList.remove('active');
      tabSandbox.setAttribute('aria-selected', 'true');
      tabChat.setAttribute('aria-selected', 'false');

      chatMessages.classList.add('hidden-view');
      if (chatInputBar) chatInputBar.classList.add('hidden-view');
      sandboxView.classList.add('active-view');
    });
  }
}

/**
 * 3. Heuristic Preset Chips in Window Header
 * Alterna borda neon ciano e atualiza texto explicativo de telemetria abaixo
 */
const PRESET_DATA = {
  'Profundo': {
    title: 'Profundo (CoT)',
    desc: '<strong>Profundo (CoT):</strong> Raciocínio estendido (Chain-of-Thought) habilitado com alta densidade lógica para arquitetura e refatoração complexa.',
    temp: '0.20',
    topP: '0.95',
    mode: 'Chain-of-Thought Ativo'
  },
  'Código': {
    title: 'Código',
    desc: '<strong>Código:</strong> Geração determinística e precisa, sem alucinações, com foco em testes unitários e TypeScript estrito.',
    temp: '0.10',
    topP: '0.90',
    mode: 'Determinístico (Seed Fixa)'
  },
  'Criativo': {
    title: 'Criativo',
    desc: '<strong>Criativo:</strong> Ampla exploração heurística e ideação adaptativa para design de interfaces e copywriting técnico.',
    temp: '0.85',
    topP: '0.98',
    mode: 'Temperatura Dinâmica'
  },
  'Rápido': {
    title: 'Rápido',
    desc: '<strong>Rápido:</strong> Máxima fluidez e menor latência de streaming via cluster NVIDIA NIM para respostas ágeis.',
    temp: '0.50',
    topP: '0.90',
    mode: 'Streaming Express'
  }
};

function initPresetChips() {
  const chips = document.querySelectorAll('.preset-chip');
  const presetIndicator = document.getElementById('activePresetIndicator');
  const presetDescription = document.getElementById('activePresetDescription');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const presetKey = chip.dataset.preset;
      const data = PRESET_DATA[presetKey];

      if (data) {
        if (presetIndicator) {
          presetIndicator.textContent = data.title;
        }
        if (presetDescription) {
          presetDescription.innerHTML = data.desc;
        }
        showToast(`Motor Heurístico ajustado para: ${data.title}`);
      }
    });
  });
}

/**
 * 4. Interactive Diagnostic Simulator
 * Simula a verificação em tempo real da chave NVIDIA NIM e endpoint do modelo Nemotron
 */
function initDiagnosticSimulator() {
  const runBtn = document.getElementById('runDiagBtn');
  const consoleOutput = document.getElementById('diagLogsContainer');

  if (!runBtn || !consoleOutput) return;

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.textContent = 'Diagnosticando...';

    consoleOutput.innerHTML = `
      <div class="diag-log-line running">
        <span>⚡</span> [1/3] Validando formato da API Key NVIDIA NIM (nvapi-...)...
      </div>
    `;

    await wait(600);
    consoleOutput.innerHTML += `
      <div class="diag-log-line success">
        <span>✓</span> Chave NVAPI válida e autenticada com sucesso no gateway NVIDIA.
      </div>
      <div class="diag-log-line running">
        <span>⚡</span> [2/3] Pingando nó de inferência Nemotron 3.5 Super VL 120B...
      </div>
    `;

    await wait(700);
    consoleOutput.innerHTML += `
      <div class="diag-log-line success">
        <span>✓</span> Conexão ativa estabelecida. Latência de primeiro token (TTFT): 112ms.
      </div>
      <div class="diag-log-line running">
        <span>⚡</span> [3/3] Checando capacidades de CoT, NeMo Guardrails e Context Bridge...
      </div>
    `;

    await wait(650);
    consoleOutput.innerHTML += `
      <div class="diag-log-line success" style="font-weight: bold; color: var(--neon-cyan);">
        <span>✨</span> DIAGNÓSTICO CONCLUÍDO: Todos os serviços operacionais. NVIDIA OK ✓
      </div>
    `;

    runBtn.disabled = false;
    runBtn.textContent = 'Repetir Diagnóstico';
    showToast('Diagnóstico concluído com sucesso: Cluster NVIDIA NIM 100% Operacional ✓');
  });
}

/**
 * 5. Code Copy Buttons with Visual Feedback
 */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.copy-btn');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy-target');
      let textToCopy = '';

      if (targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          textToCopy = targetElement.innerText || targetElement.textContent;
        }
      } else {
        textToCopy = btn.getAttribute('data-copy-text') || '';
      }

      if (textToCopy) {
        try {
          await navigator.clipboard.writeText(textToCopy);
          const originalHTML = btn.innerHTML;
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg> <span>Copiado!</span>
          `;
          btn.style.color = 'var(--neon-teal)';
          showToast('Código copiado para a área de transferência!');

          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.color = '';
          }, 2000);
        } catch (err) {
          console.warn('Falha ao copiar:', err);
        }
      }
    });
  });
}

/**
 * 6. Windows Download Feedback
 */
function initDownloadFeedback() {
  const downloadBtns = document.querySelectorAll('.btn-download-action');

  downloadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🚀 Iniciando download do instalador Cloudtron-OneClick-Setup-1.2.0.exe...');
    });
  });
}

/**
 * 7. Mouse Glow Follow on Cards
 */
function initCardMouseGlow() {
  const cards = document.querySelectorAll('.feature-card, .window-frame, .step-card, .cta-banner');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/**
 * 8. Mobile Navigation Toggle
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const drawerLinks = document.querySelectorAll('.mobile-nav-link');

  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => {
      drawer.classList.toggle('open');
    });

    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
      });
    });
  }
}

/**
 * 9. Back To Top Button
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTopBtn');

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/**
 * 10. Interactive Sandbox Demo Simulation
 */
function initInteractiveSandbox() {
  const simTweakBtn = document.getElementById('sandboxTweakBtn');
  const arrVal = document.getElementById('sandboxArrVal');
  const latVal = document.getElementById('sandboxLatVal');

  if (simTweakBtn && arrVal && latVal) {
    let toggled = false;
    simTweakBtn.addEventListener('click', () => {
      toggled = !toggled;
      if (toggled) {
        latVal.textContent = '94 ms';
        arrVal.textContent = 'R$ 2.45M';
        showToast('Sandbox re-renderizado com hot-reload! Latência NIM: 94ms');
      } else {
        latVal.textContent = '124 ms';
        arrVal.textContent = 'R$ 1.84M';
        showToast('Sandbox re-renderizado! Latência NIM: 124ms');
      }
    });
  }
}

/**
 * Reusable Cyber Toast Message
 */
function showToast(message) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </svg>
    </span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3600);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
