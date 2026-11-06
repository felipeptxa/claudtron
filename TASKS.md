# TASKS - CLOUDTRON ONECLICK

### TAREFA ATIVA: Correção de IDs Nulos no openSettingsModal (@app.html)

- [x] **Alvos:** `@app.html` e `@docs/app.html`
- [x] **Status:** CONCLUÍDO & VALIDADO (19/19 Testes PASS)
- [x] **Prioridade:** Bloqueador Crítico (Resolvido)

#### 1. Diagnóstico & Causa-Raiz
- Exceção `TypeError: Cannot set properties of null (setting 'value')` na linha ~4736 dentro de `openSettingsModal()` causada pela referência a `modalKeyInput` (ID antigo que não existia no DOM).
- O script tentava definir `.value` antes de verificar a existência do elemento, interrompendo a rotina antes da abertura da interface (`modal.classList.add('aberto')`).

#### 2. Resoluções Implementadas
1. **Blindagem com Verificação Guard (`setVal` & `getVal`):**
   - Implementadas funções guard inteligentes que aceitam arrays de identificadores (`['providerKeyNVIDIA', 'setting-nvidia-key', 'modalKeyInput']`), mapeando tanto a nomenclatura moderna dos Tiers de Provedores quanto os identificadores legados.
   - Tratamento seguro de credenciais, sliders, checkboxes e prompts de sistema.
2. **Abertura Garantida do Contentor:**
   - Adicionada ativação visual imediata (`modal.classList.add('aberto'); modal.style.display = 'flex';`) e garantia final no bloco `finally`.
3. **Persistência Imunizada em `saveSettingsModal()`:**
   - Atualizada a função de gravação com o helper `getVal()`, eliminando qualquer risco de crash nulo ao salvar as credenciais.
4. **Replicação:**
   - Aplicado sincronizadamente em `GITHUB/app.html` e `GITHUB/docs/app.html`.

#### 3. Critérios de Aceitação & Validação
- [x] Ao clicar no botão de engrenagem ⚙️ na interface desktop, o modal surge imediatamente com `display: flex` e classe `.aberto`.
- [x] Console do DevTools sem nenhum erro do tipo `TypeError`.
- [x] Suíte de testes `npm test` executada com sucesso total: **19/19 PASSOU (0 falhas)**.
