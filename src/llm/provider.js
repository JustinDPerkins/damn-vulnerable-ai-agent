/**
 * LLM Provider - Abstraction over OpenAI, Anthropic, and Ollama APIs
 *
 * Supports BYOK (Bring Your Own Key). The user's API key is stored
 * in memory only, never persisted to disk or sent to any server.
 *
 * Ollama uses the OpenAI-compatible API (no real key required).
 * Prefer env for lab/K8s:
 *   DVAA_LLM_PROVIDER=ollama
 *   DVAA_LLM_MODEL=llama3.2
 *   OLLAMA_BASE_URL=http://host.docker.internal:11434/v1
 */

// In-memory API key storage (never persisted)
let llmConfig = {
  provider: null,    // 'openai' | 'anthropic' | 'ollama'
  apiKey: null,
  model: null,
  baseUrl: null,     // OpenAI-compatible base (ollama / proxies)
  enabled: false,
};

const DEFAULT_OLLAMA_BASE =
  process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';

export function configureLLM({ provider, apiKey, model, baseUrl }) {
  if (!provider) {
    throw new Error('provider is required');
  }

  const normalized = String(provider).toLowerCase();
  if (!['openai', 'anthropic', 'ollama'].includes(normalized)) {
    throw new Error(`unsupported provider: ${provider}`);
  }

  // Ollama ignores the key but OpenAI clients require a non-empty Bearer token.
  const key = (apiKey && String(apiKey).trim()) || (normalized === 'ollama' ? 'ollama' : '');
  if (!key) {
    throw new Error('provider and apiKey are required');
  }

  const defaults = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-sonnet-4-6',
    ollama: process.env.DVAA_LLM_MODEL || 'llama3.2',
  };

  const resolvedBase = normalized === 'ollama'
    ? stripTrailingSlash(baseUrl || DEFAULT_OLLAMA_BASE)
    : (baseUrl ? stripTrailingSlash(baseUrl) : null);

  llmConfig = {
    provider: normalized,
    apiKey: key,
    model: model || defaults[normalized] || 'gpt-4o-mini',
    baseUrl: resolvedBase,
    enabled: true,
  };

  return {
    provider: llmConfig.provider,
    model: llmConfig.model,
    baseUrl: llmConfig.baseUrl,
    enabled: true,
  };
}

/** Auto-enable from env when DVAA_LLM_PROVIDER is set (lab / compose / K8s). */
export function configureLLMFromEnv(env = process.env) {
  const provider = (env.DVAA_LLM_PROVIDER || '').trim().toLowerCase();
  if (!provider) return null;
  return configureLLM({
    provider,
    apiKey: env.DVAA_LLM_API_KEY || (provider === 'ollama' ? 'ollama' : ''),
    model: env.DVAA_LLM_MODEL || undefined,
    baseUrl: env.OLLAMA_BASE_URL || env.DVAA_LLM_BASE_URL || undefined,
  });
}

export function getLLMConfig() {
  return {
    provider: llmConfig.provider,
    model: llmConfig.model,
    baseUrl: llmConfig.baseUrl,
    enabled: llmConfig.enabled,
  };
}

export function disableLLM() {
  llmConfig.enabled = false;
  llmConfig.apiKey = null;
  llmConfig.baseUrl = null;
  return { enabled: false };
}

export function isLLMEnabled() {
  return llmConfig.enabled && !!llmConfig.apiKey;
}

/**
 * Call the LLM with a system prompt and user message.
 * Returns the assistant's response text.
 */
export async function callLLM(systemPrompt, messages, options = {}) {
  if (!llmConfig.enabled || !llmConfig.apiKey) {
    return null; // Fallback to canned responses
  }

  const { maxTokens = 1024, temperature = 0.7 } = options;

  try {
    if (llmConfig.provider === 'openai') {
      return await callOpenAICompatible(systemPrompt, messages, maxTokens, {
        baseUrl: 'https://api.openai.com/v1',
        // Newer OpenAI models prefer max_completion_tokens
        useMaxCompletionTokens: true,
      });
    }
    if (llmConfig.provider === 'ollama') {
      return await callOpenAICompatible(systemPrompt, messages, maxTokens, {
        baseUrl: llmConfig.baseUrl || DEFAULT_OLLAMA_BASE,
        useMaxCompletionTokens: false,
        temperature,
      });
    }
    if (llmConfig.provider === 'anthropic') {
      return await callAnthropic(systemPrompt, messages, maxTokens, temperature);
    }
    return null;
  } catch (err) {
    console.error(`[LLM] Error: ${err.message}`);
    return null; // Fallback to canned responses on error
  }
}

async function callOpenAICompatible(systemPrompt, messages, maxTokens, {
  baseUrl,
  useMaxCompletionTokens = false,
  temperature,
} = {}) {
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const body = {
    model: llmConfig.model,
    messages: apiMessages,
  };

  if (useMaxCompletionTokens) {
    body.max_completion_tokens = maxTokens;
  } else {
    body.max_tokens = maxTokens;
    if (typeof temperature === 'number') body.temperature = temperature;
  }

  const resp = await fetch(`${stripTrailingSlash(baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${llmConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`LLM API error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callAnthropic(systemPrompt, messages, maxTokens, temperature) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': llmConfig.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: llmConfig.model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text || null;
}

function stripTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}
