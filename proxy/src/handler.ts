import { callGemini, DEFAULT_GEMMA_MODEL, UpstreamError, type FetchFn } from './gemini.js';
import { TokenBucketLimiter } from './rate-limiter.js';

export const MAX_PROMPT_CHARS = 8000;
export const MAX_OUTPUT_TOKENS = 2048;
/** Raw body cap: a prompt at the limit, even fully escaped, stays well below it. */
const MAX_BODY_CHARS = 32_000;

export type HandlerDeps = {
  fetch: FetchFn;
  env: Record<string, string | undefined>;
  now: () => number;
  /** Defaults to 20 requests per 10 minutes per IP. */
  rateLimit?: { capacity: number; windowMs: number };
};

type ErrorCode =
  | 'bad_request'
  | 'prompt_too_large'
  | 'method_not_allowed'
  | 'rate_limited'
  | 'server_misconfigured'
  | 'upstream_error'
  | 'upstream_empty';

const json = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

const fail = (status: number, error: ErrorCode, headers?: Record<string, string>): Response =>
  json(status, { error }, headers);

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

type CompleteRequest = { prompt: string; maxTokens: number };

/** Returns the parsed request, or the error response to send. */
function parseBody(raw: string): CompleteRequest | Response {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, 'bad_request');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return fail(400, 'bad_request');
  const { prompt, json: jsonFlag, maxTokens } = body as Record<string, unknown>;

  if (typeof prompt !== 'string' || prompt.trim() === '') return fail(400, 'bad_request');
  if (jsonFlag !== undefined && typeof jsonFlag !== 'boolean') return fail(400, 'bad_request');
  if (maxTokens !== undefined && (typeof maxTokens !== 'number' || !Number.isFinite(maxTokens) || maxTokens <= 0)) {
    return fail(400, 'bad_request');
  }
  if (prompt.length > MAX_PROMPT_CHARS) return fail(413, 'prompt_too_large');

  const requested = typeof maxTokens === 'number' ? maxTokens : MAX_OUTPUT_TOKENS;
  return { prompt, maxTokens: Math.min(Math.floor(requested) || 1, MAX_OUTPUT_TOKENS) };
}

/**
 * Pure request handler for POST /api/complete, with every side effect injected.
 * The model is fixed server-side; `json` is accepted for client compatibility but unused
 * because JSON mode is not documented for Gemma.
 *
 * The rate limiter lives in this closure, so on a serverless platform it is per function
 * instance and best-effort, not a global quota.
 */
export function createHandler(deps: HandlerDeps): (request: Request) => Promise<Response> {
  const limiter = new TokenBucketLimiter({
    capacity: deps.rateLimit?.capacity ?? 20,
    windowMs: deps.rateLimit?.windowMs ?? 10 * 60_000,
    now: deps.now,
  });

  return async (request) => {
    if (request.method !== 'POST') return fail(405, 'method_not_allowed', { Allow: 'POST' });

    const apiKey = deps.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return fail(500, 'server_misconfigured');

    const limit = limiter.take(clientKey(request));
    if (!limit.allowed) return fail(429, 'rate_limited', { 'Retry-After': String(limit.retryAfterSeconds) });

    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return fail(413, 'prompt_too_large');
    const parsed = parseBody(raw);
    if (parsed instanceof Response) return parsed;

    try {
      const text = await callGemini(
        {
          fetch: deps.fetch,
          apiKey,
          model: deps.env.GEMINI_MODEL?.trim() || DEFAULT_GEMMA_MODEL,
          // Server-side only and optional: never read from the request body.
          thinkingLevel: deps.env.GEMINI_THINKING_LEVEL?.trim() || undefined,
        },
        parsed.prompt,
        parsed.maxTokens,
      );
      return json(200, { text });
    } catch (error) {
      return fail(502, error instanceof UpstreamError ? error.code : 'upstream_error');
    }
  };
}
