/**
 * CLAUTRON OneClick - Interactive Scripts
 * Ultra performant, zero dependencies, vanilla JS.
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
 */
function initThinkingToggle() {
  const thinkingBox = document.getElementById('thinkingBox');
  const thinkingHeader = document.getElementById('thinkingHeader');

  if (thinkingBox && thinkingHeader) {
    thinkingHeader.addEventListener('click', () => {
      thinkingBox.classList.toggle('expanded');
    });
  }
}

/**
 * 2. Mockup View Tabs (Chat vs Live Sandbox)
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
      chatMessages.classList.remove('hidden-view');
      chatInputBar.classList.remove('hidden-view');
      sandboxView.classList.remove('active-view');
    });

    tabSandbox.addEventListener('click', () => {
      tabSandbox.classList.add('active');
      tabChat.classList.remove('active');
      chatMessages.classList.add('hidden-view');
      chatInputBar.classList.add('hidden-view');
      sandboxView.classList.add('active-view');
    });
  }
}

/**
 * 3. Heuristic Preset Chips in Window Header
 */
function initPresetChips() {
  const chips = document.querySelectorAll('.preset-chip');
  const presetDisplay = document.getElementById('activePresetIndicator');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const presetName = chip.dataset.preset;
      if (presetDisplay) {
        presetDisplay.textContent = presetName;
      }
      showToast(`Motor Heurístico ajustado para: ${presetName}`);
    });
  });
}

/**
 * 4. Interactive Diagnostic Simulator
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
        <span>⚡</span> [1/3] Validando formato da API Key da NVIDIA (nvapi-...)...
      </div>
    `;

    await wait(600);
    consoleOutput.innerHTML += `
      <div class="diag-log-line success">
        <span>✓</span> Chave NVAPI válida e autenticada via NVIDIA NIM.
      </div>
      <div class="diag-log-line running">
        <span>⚡</span> [2/3] Pingando nó de inferência Nemotron 120B Super VL...
      </div>
    `;

    await wait(700);
    consoleOutput.innerHTML += `
      <div class="diag-log-line success">
        <span>✓</span> Conexão estabelecida com sucesso. Latência: 118ms.
      </div>
      <div class="diag-log-line running">
        <span>⚡</span> [3/3] Checando capacidades de CoT e Visão Multimodal...
      </div>
    `;

    await wait(600);
    consoleOutput.innerHTML += `
      <div class="diag-log-line success" style="font-weight: bold; color: var(--neon-cyan);">
        <span>✨</span> DIAGNÓSTICO CONCLUÍDO: Todos os serviços operacionais. NVIDIA OK ✓
      </div>
    `;

    runBtn.disabled = false;
    runBtn.textContent = 'Repetir Diagnóstico';
    showToast('Diagnóstico em 2 Passos concluído com sucesso: NVIDIA OK ✓');
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
          const originalText = btn.innerHTML;
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg> Copiado!
          `;
          btn.style.color = 'var(--neon-green)';
          showToast('Código copiado para a área de transferência!');

          setTimeout(() => {
            btn.innerHTML = originalText;
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
      showToast('🚀 Iniciando download de CLAUTRON-OneClick-Setup-1.1.0.exe...');
    });
  });
}

/**
 * 7. Mouse Glow Follow on Cards
 */
function initCardMouseGlow() {
  const cards = document.querySelectorAll('.feature-card, .window-frame');

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
 * 10. Interactive Sandbox Demo Buttons
 */
function initInteractiveSandbox() {
  const simTweakBtn = document.getElementById('sandboxTweakBtn');
  const arrVal = document.getElementById('sandboxArrVal');
  const latVal = document.getElementById('sandboxLatVal');

  if (simTweakBtn && arrVal && latVal) {
    simTweakBtn.addEventListener('click', () => {
      const currentLat = parseInt(latVal.textContent) || 124;
      const newLat = currentLat === 124 ? 98 : 124;
      latVal.textContent = `${newLat} ms`;
      showToast(`Sandbox atualizado em tempo real! Nova latência: ${newLat}ms`);
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
