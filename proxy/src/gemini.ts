export type FetchFn = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

export type GeminiConfig = {
  fetch: FetchFn;
  apiKey: string;
  model: string;
  timeoutMs?: number;
};

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
/** Gemma 4 ids documented for the Gemini API: gemma-4-31b-it and gemma-4-26b-a4b-it. */
export const DEFAULT_GEMMA_MODEL = 'gemma-4-26b-a4b-it';
export const DEFAULT_UPSTREAM_TIMEOUT_MS = 50_000;

/** The upstream call failed or returned nothing usable. The message never contains the key or the upstream body. */
export class UpstreamError extends Error {
  constructor(
    readonly code: 'upstream_error' | 'upstream_empty',
    message: string,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

/**
 * Calls Gemma through the Gemini API generateContent endpoint. JSON mode (responseMimeType)
 * is not documented for Gemma, so callers ask for strict JSON in the prompt and validate it.
 */
export async function callGemini(config: GeminiConfig, prompt: string, maxTokens?: number): Promise<string> {
  const body: Record<string, unknown> = { contents: [{ parts: [{ text: prompt }] }] };
  if (maxTokens !== undefined) body.generationConfig = { maxOutputTokens: maxTokens };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_UPSTREAM_TIMEOUT_MS);
  let data: any;
  try {
    const response = await config.fetch(`${GEMINI_API_BASE}/models/${encodeURIComponent(config.model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new UpstreamError('upstream_error', `Gemini API request failed with status ${response.status}`);
    data = await response.json();
  } finally {
    clearTimeout(timer);
  }

  const parts: unknown[] = Array.isArray(data?.candidates?.[0]?.content?.parts) ? data.candidates[0].content.parts : [];
  const text = parts
    .filter((p: any) => typeof p?.text === 'string' && p.thought !== true)
    .map((p: any) => p.text)
    .join('');
  if (text === '') throw new UpstreamError('upstream_empty', 'Gemini API returned no text');
  return text;
}
