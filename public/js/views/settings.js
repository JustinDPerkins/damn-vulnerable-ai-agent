/**
 * Settings view - LLM API key configuration
 */

import { el } from '../utils.js';
import { configureLLM, disableLLM } from '../api.js';

const PRIVACY_FACTS = [
  'This lab build defaults telemetry off via OPENA2A_TELEMETRY=off when you start with that env (recommended).',
  'LLM mode: your API key (if any) stays in memory on this local server and is sent only to the provider you chose '
    + '(Ollama, OpenAI, or Anthropic). It is not written to disk. Disable or restart to clear it.',
  'While LLM mode is on, agent conversations and tutor requests go to that provider.',
  'ResearchBot / FlightBot (and their AIM variants) can fetch http(s) URLs from your messages.',
];

export function renderSettings(state) {
  const wrap = el('div', { className: 'settings-view' });

  wrap.appendChild(el('div', { className: 'section-header' }, 'Settings'));

  // LLM Configuration
  const llmSection = el('div', { className: 'settings-section' });
  llmSection.appendChild(el('h3', { className: 'settings-title' }, 'LLM Configuration'));
  llmSection.appendChild(el('p', { className: 'settings-desc' },
    'Enable intelligent mode with Ollama (free/local), OpenAI, or Anthropic. Agents use real LLM responses with vulnerable system prompts, and the tutor guides attacks.'));

  // Provider select
  const providerRow = el('div', { className: 'settings-row' });
  providerRow.appendChild(el('label', {}, 'Provider'));
  const providerSelect = el('select', { className: 'settings-input', id: 'llm-provider' });
  providerSelect.appendChild(el('option', { value: 'ollama' }, 'Ollama (local / free)'));
  providerSelect.appendChild(el('option', { value: 'openai' }, 'OpenAI'));
  providerSelect.appendChild(el('option', { value: 'anthropic' }, 'Anthropic'));
  providerRow.appendChild(providerSelect);
  llmSection.appendChild(providerRow);

  // Ollama base URL
  const baseRow = el('div', { className: 'settings-row', id: 'llm-base-row' });
  baseRow.appendChild(el('label', {}, 'Ollama Base URL'));
  const baseInput = el('input', {
    className: 'settings-input',
    type: 'text',
    placeholder: 'http://127.0.0.1:11434/v1',
    id: 'llm-base-url',
    value: 'http://127.0.0.1:11434/v1',
  });
  baseRow.appendChild(baseInput);
  llmSection.appendChild(baseRow);

  // API Key input
  const keyRow = el('div', { className: 'settings-row', id: 'llm-key-row' });
  keyRow.appendChild(el('label', {}, 'API Key'));
  const keyInput = el('input', {
    className: 'settings-input',
    type: 'password',
    placeholder: 'sk-... or sk-ant-... (Ollama: leave blank)',
    id: 'llm-key',
  });
  keyRow.appendChild(keyInput);
  llmSection.appendChild(keyRow);

  // Model select
  const modelRow = el('div', { className: 'settings-row' });
  modelRow.appendChild(el('label', {}, 'Model'));
  const modelInput = el('input', {
    className: 'settings-input',
    type: 'text',
    placeholder: 'llama3.2 (Ollama default)',
    id: 'llm-model',
  });
  modelRow.appendChild(modelInput);
  llmSection.appendChild(modelRow);

  const syncProviderUi = () => {
    const isOllama = providerSelect.value === 'ollama';
    baseRow.style.display = isOllama ? '' : 'none';
    keyInput.placeholder = isOllama ? 'optional (ignored by Ollama)' : 'sk-... or sk-ant-...';
    modelInput.placeholder = isOllama ? 'llama3.2' : 'gpt-4o-mini / claude-sonnet-4-6';
  };
  providerSelect.addEventListener('change', syncProviderUi);
  syncProviderUi();

  // Buttons
  const btnRow = el('div', { className: 'settings-btn-row' });
  const enableBtn = el('button', { className: 'btn btn-primary' }, 'Enable LLM Mode');
  const disableBtn = el('button', { className: 'btn btn-danger' }, 'Disable');
  const statusEl = el('span', { className: 'settings-status', id: 'llm-status-text' }, '');
  btnRow.appendChild(enableBtn);
  btnRow.appendChild(disableBtn);
  btnRow.appendChild(statusEl);
  llmSection.appendChild(btnRow);

  wrap.appendChild(llmSection);

  // Privacy notice
  const privacy = el('div', { className: 'settings-section settings-privacy' });
  privacy.appendChild(el('h3', { className: 'settings-title' }, 'Privacy'));
  const privacyList = el('ul', { className: 'settings-privacy-list' });
  PRIVACY_FACTS.forEach(text => privacyList.appendChild(el('li', {}, text)));
  privacy.appendChild(privacyList);
  wrap.appendChild(privacy);

  // Event handlers
  enableBtn.addEventListener('click', async () => {
    const provider = providerSelect.value;
    const apiKey = keyInput.value.trim();
    const model = modelInput.value.trim() || undefined;
    const baseUrl = baseInput.value.trim() || undefined;

    if (provider !== 'ollama' && !apiKey) {
      statusEl.textContent = 'API key is required';
      statusEl.className = 'settings-status error';
      return;
    }

    try {
      const data = await configureLLM(provider, apiKey || 'ollama', model, provider === 'ollama' ? baseUrl : undefined);
      const extra = data.baseUrl ? ` @ ${data.baseUrl}` : '';
      statusEl.textContent = `Active: ${data.provider} (${data.model})${extra}`;
      statusEl.className = 'settings-status active';
      keyInput.value = '';
    } catch (err) {
      statusEl.textContent = `Error: ${err.message}`;
      statusEl.className = 'settings-status error';
    }
  });

  disableBtn.addEventListener('click', async () => {
    try {
      await disableLLM();
      statusEl.textContent = 'LLM mode disabled';
      statusEl.className = 'settings-status';
    } catch (err) {
      statusEl.textContent = `Error: ${err.message}`;
      statusEl.className = 'settings-status error';
    }
  });

  // Load current status
  fetch('/api/llm/status').then(r => r.json()).then(data => {
    const statusText = document.getElementById('llm-status-text');
    if (statusText) {
      if (data.enabled) {
        const extra = data.baseUrl ? ` @ ${data.baseUrl}` : '';
        statusText.textContent = `Active: ${data.provider} (${data.model})${extra}`;
        statusText.className = 'settings-status active';
        if (data.provider) providerSelect.value = data.provider;
        if (data.model) modelInput.value = data.model;
        if (data.baseUrl) baseInput.value = data.baseUrl;
        syncProviderUi();
      } else {
        statusText.textContent = 'LLM mode off (default)';
        statusText.className = 'settings-status';
      }
    }
  }).catch(() => {});

  return wrap;
}
