import { DEFAULT_GEMMA_MODEL } from '../adapters/llm/gemini';
import { DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_URL } from '../adapters/llm/ollama';

export type LlmConfig =
  | { kind: 'gemini'; apiKey: string; model: string }
  | { kind: 'ollama'; baseUrl: string; model: string };

export type Env = Record<string, string | undefined>;

const clean = (value: string | undefined): string | undefined => value?.trim() || undefined;

/**
 * Picks the LLM backend from environment variables. Note that EXPO_PUBLIC_* values are
 * inlined into the bundle, so a Gemini key configured this way ships inside the APK.
 * In development, a phone reaches a host Ollama with `adb reverse tcp:11434 tcp:11434`.
 */
export function resolveLlmConfig(env: Env): LlmConfig {
  const apiKey = clean(env.EXPO_PUBLIC_GEMINI_API_KEY);
  if (apiKey) return { kind: 'gemini', apiKey, model: DEFAULT_GEMMA_MODEL };
  return {
    kind: 'ollama',
    baseUrl: clean(env.EXPO_PUBLIC_OLLAMA_URL) ?? DEFAULT_OLLAMA_URL,
    model: clean(env.EXPO_PUBLIC_OLLAMA_MODEL) ?? DEFAULT_OLLAMA_MODEL,
  };
}
