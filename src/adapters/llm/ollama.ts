import type { LlmClient, LlmCompletionOptions } from '../../domain/ports';
import { DEFAULT_LLM_TIMEOUT_MS, postJson, type FetchFn } from './http';

export type OllamaOptions = {
  fetch: FetchFn;
  /** Defaults to a local Ollama. On an Android emulator use http://10.0.2.2:11434. */
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
};

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'gemma3:4b';

/** Development client for a local Ollama server (POST /api/generate, non-streaming). */
export class OllamaClient implements LlmClient {
  constructor(private readonly options: OllamaOptions) {}

  async complete(prompt: string, opts: LlmCompletionOptions = {}): Promise<string> {
    const baseUrl = (this.options.baseUrl ?? DEFAULT_OLLAMA_URL).replace(/\/+$/, '');
    const body: Record<string, unknown> = {
      model: this.options.model ?? DEFAULT_OLLAMA_MODEL,
      prompt,
      stream: false,
    };
    if (opts.json) body.format = 'json';
    if (opts.maxTokens !== undefined) body.options = { num_predict: opts.maxTokens };

    const data = await postJson(
      this.options.fetch,
      `${baseUrl}/api/generate`,
      {},
      body,
      this.options.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS,
      'Ollama',
    );
    if (typeof data?.response !== 'string') throw new Error('Ollama returned no response text');
    return data.response;
  }
}
