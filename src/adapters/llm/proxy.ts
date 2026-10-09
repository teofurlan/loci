import type { LlmClient, LlmCompletionOptions } from '../../domain/ports';
import { postJson, type FetchFn } from './http';

/** Above the proxy's 110 s upstream timeout, so a slow but legitimate story can still arrive. */
export const PROXY_TIMEOUT_MS = 120_000;

export type ProxyOptions = {
  fetch: FetchFn;
  /** Origin of the deployed proxy, for example https://loci-proxy.vercel.app. */
  baseUrl: string;
  timeoutMs?: number;
};

/**
 * Production client: talks to the server-side proxy (POST /api/complete), which holds the
 * Gemini key and fixes the model. The app never sees or sends an API key.
 */
export class ProxyLlmClient implements LlmClient {
  constructor(private readonly options: ProxyOptions) {}

  async complete(prompt: string, opts: LlmCompletionOptions = {}): Promise<string> {
    const body: Record<string, unknown> = { prompt };
    if (opts.json !== undefined) body.json = opts.json;
    if (opts.maxTokens !== undefined) body.maxTokens = opts.maxTokens;

    const data = await postJson(
      this.options.fetch,
      `${this.options.baseUrl.replace(/\/+$/, '')}/api/complete`,
      {},
      body,
      this.options.timeoutMs ?? PROXY_TIMEOUT_MS,
      'LLM proxy',
    );
    if (typeof data?.text !== 'string' || data.text === '') throw new Error('LLM proxy returned no text');
    return data.text;
  }
}
