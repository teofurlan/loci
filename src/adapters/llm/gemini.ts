import type { LlmClient, LlmCompletionOptions } from '../../domain/ports';
import { DEFAULT_LLM_TIMEOUT_MS, postJson, type FetchFn } from './http';

export type GeminiApiOptions = {
  fetch: FetchFn;
  apiKey: string;
  model?: string;
  timeoutMs?: number;
};

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
/** Gemma 4 ids documented for the Gemini API: gemma-4-31b-it and gemma-4-26b-a4b-it. */
export const DEFAULT_GEMMA_MODEL = 'gemma-4-26b-a4b-it';

/**
 * Production client: Gemma through the Gemini API (Google AI Studio) generateContent.
 * JSON mode (responseMimeType) is not documented for Gemma, so `json` is ignored here and
 * the prompts ask for strict JSON instead; callers extract and validate the output.
 */
export class GeminiApiClient implements LlmClient {
  constructor(private readonly options: GeminiApiOptions) {}

  async complete(prompt: string, opts: LlmCompletionOptions = {}): Promise<string> {
    const model = this.options.model ?? DEFAULT_GEMMA_MODEL;
    const body: Record<string, unknown> = { contents: [{ parts: [{ text: prompt }] }] };
    if (opts.maxTokens !== undefined) body.generationConfig = { maxOutputTokens: opts.maxTokens };

    const data = await postJson(
      this.options.fetch,
      `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`,
      { 'x-goog-api-key': this.options.apiKey },
      body,
      this.options.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS,
      'Gemini API',
    );

    const parts: unknown[] = Array.isArray(data?.candidates?.[0]?.content?.parts) ? data.candidates[0].content.parts : [];
    const text = parts
      .filter((p: any) => typeof p?.text === 'string' && p.thought !== true)
      .map((p: any) => p.text)
      .join('');
    if (text === '') throw new Error('Gemini API returned no text');
    return text;
  }
}
