import { DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_URL } from '../adapters/llm/ollama';

export type LlmConfig =
  | { kind: 'proxy'; baseUrl: string }
  | { kind: 'ollama'; baseUrl: string; model: string };

export type Env = Record<string, string | undefined>;

const clean = (value: string | undefined): string | undefined => value?.trim() || undefined;

/**
 * Picks the LLM backend from environment variables. Production uses the server-side proxy
 * (EXPO_PUBLIC_LLM_PROXY_URL), which holds the Gemini key; no key is ever configured in the app.
 * In development, a phone reaches a host Ollama with `adb reverse tcp:11434 tcp:11434`.
 */
export function resolveLlmConfig(env: Env): LlmConfig {
  const proxyUrl = clean(env.EXPO_PUBLIC_LLM_PROXY_URL);
  if (proxyUrl) return { kind: 'proxy', baseUrl: proxyUrl };
  return {
    kind: 'ollama',
    baseUrl: clean(env.EXPO_PUBLIC_OLLAMA_URL) ?? DEFAULT_OLLAMA_URL,
    model: clean(env.EXPO_PUBLIC_OLLAMA_MODEL) ?? DEFAULT_OLLAMA_MODEL,
  };
}
