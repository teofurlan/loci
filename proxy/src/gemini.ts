export type FetchFn = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

export type GeminiConfig = {
  fetch: FetchFn;
  apiKey: string;
  model: string;
  timeoutMs?: number;
  /** Experimental, unofficial for Gemma 4: sent as generationConfig.thinkingConfig.thinkingLevel. Omit to send nothing. */
  thinkingLevel?: string;
};

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
/** Gemma 4 ids documented for the Gemini API: gemma-4-31b-it and gemma-4-26b-a4b-it. */
export const DEFAULT_GEMMA_MODEL = 'gemma-4-26b-a4b-it';
/** Gemma 4 with thinking can take over a minute; stays under the function's 120 s maxDuration (vercel.json). */
export const DEFAULT_UPSTREAM_TIMEOUT_MS = 110_000;
/**
 * Gemma 4 thinks before answering, and its reasoning tokens count against maxOutputTokens.
 * With a small budget it can spend everything on thinking and return no text, so the
 * caller's maxTokens is treated as the visible-answer budget and this headroom is added on top.
 */
export const THINKING_HEADROOM_TOKENS = 2048;

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
  const generationConfig: Record<string, unknown> = {};
  if (maxTokens !== undefined) generationConfig.maxOutputTokens = maxTokens + THINKING_HEADROOM_TOKENS;
  if (config.thinkingLevel) generationConfig.thinkingConfig = { thinkingLevel: config.thinkingLevel };
  if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

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
