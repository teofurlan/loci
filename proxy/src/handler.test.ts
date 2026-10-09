/** @jest-environment node */
import { THINKING_HEADROOM_TOKENS } from './gemini';
import { createHandler, MAX_OUTPUT_TOKENS, MAX_PROMPT_CHARS } from './handler';

const SECRET = 'SECRET-KEY';
const geminiReply = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });

type FetchMock = jest.Mock<Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>, [string, any]>;

function setup(
  overrides: { fetch?: FetchMock; env?: Record<string, string | undefined>; limit?: number; logger?: jest.Mock } = {},
) {
  let now = 0;
  const fetchFn: FetchMock =
    overrides.fetch ?? (jest.fn(async () => ({ ok: true, status: 200, json: async () => geminiReply('story') })) as unknown as FetchMock);
  const handler = createHandler({
    fetch: fetchFn as never,
    env: overrides.env ?? { GEMINI_API_KEY: SECRET },
    now: () => now,
    logger: overrides.logger ?? jest.fn(),
    rateLimit: { capacity: overrides.limit ?? 20, windowMs: 600_000 },
  });
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    handler(
      new Request('https://proxy.test/api/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      }),
    );
  return { handler, post, fetchFn, advance: (ms: number) => (now += ms) };
}

describe('createHandler', () => {
  describe('success', () => {
    it('returns {text} from the upstream model', async () => {
      const { post } = setup();
      const res = await post({ prompt: 'hello' });
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');
      expect(await res.json()).toEqual({ text: 'story' });
    });

    it('calls Gemini with the server key and the default model, ignoring client-chosen models', async () => {
      const { post, fetchFn } = setup();
      await post({ prompt: 'hello', model: 'evil-model', json: true });
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toContain('/models/gemma-4-26b-a4b-it:generateContent');
      expect(init.headers['x-goog-api-key']).toBe(SECRET);
    });

    it('lets GEMINI_MODEL override the default model', async () => {
      const { post, fetchFn } = setup({ env: { GEMINI_API_KEY: SECRET, GEMINI_MODEL: 'gemma-4-31b-it' } });
      await post({ prompt: 'hello' });
      expect(fetchFn.mock.calls[0][0]).toContain('/models/gemma-4-31b-it:generateContent');
    });

    it('passes GEMINI_THINKING_LEVEL (trimmed) to Gemini as thinkingConfig', async () => {
      const { post, fetchFn } = setup({ env: { GEMINI_API_KEY: SECRET, GEMINI_THINKING_LEVEL: ' MINIMAL ' } });
      await post({ prompt: 'hello', maxTokens: 100 });
      expect(JSON.parse(fetchFn.mock.calls[0][1].body).generationConfig.thinkingConfig).toEqual({
        thinkingLevel: 'MINIMAL',
      });
    });

    it('sends no thinkingConfig when GEMINI_THINKING_LEVEL is blank or unset', async () => {
      const blank = setup({ env: { GEMINI_API_KEY: SECRET, GEMINI_THINKING_LEVEL: '  ' } });
      await blank.post({ prompt: 'hello' });
      expect(blank.fetchFn.mock.calls[0][1].body).not.toContain('thinkingConfig');
      const unset = setup();
      await unset.post({ prompt: 'hello' });
      expect(unset.fetchFn.mock.calls[0][1].body).not.toContain('thinkingConfig');
    });

    it('never takes the thinking level from the request body', async () => {
      const { post, fetchFn } = setup();
      await post({ prompt: 'hello', thinkingLevel: 'HIGH', thinkingConfig: { thinkingLevel: 'HIGH' } });
      expect(fetchFn.mock.calls[0][1].body).not.toContain('thinkingConfig');
    });

    it('treats a blank GEMINI_MODEL as unset', async () => {
      const { post, fetchFn } = setup({ env: { GEMINI_API_KEY: SECRET, GEMINI_MODEL: '  ' } });
      await post({ prompt: 'hello' });
      expect(fetchFn.mock.calls[0][0]).toContain('/models/gemma-4-26b-a4b-it:');
    });
  });

  describe('token caps', () => {
    // The visible-answer budget; callGemini adds the thinking headroom on top.
    const sentMaxTokens = (fetchFn: FetchMock) =>
      JSON.parse(fetchFn.mock.calls[0][1].body).generationConfig.maxOutputTokens - THINKING_HEADROOM_TOKENS;

    it('passes through a maxTokens below the cap', async () => {
      const { post, fetchFn } = setup();
      await post({ prompt: 'x', maxTokens: 300 });
      expect(sentMaxTokens(fetchFn)).toBe(300);
    });

    it('clamps maxTokens to the cap', async () => {
      const { post, fetchFn } = setup();
      await post({ prompt: 'x', maxTokens: 50_000 });
      expect(sentMaxTokens(fetchFn)).toBe(MAX_OUTPUT_TOKENS);
      expect(MAX_OUTPUT_TOKENS).toBe(2048);
    });

    it('applies the cap when maxTokens is omitted', async () => {
      const { post, fetchFn } = setup();
      await post({ prompt: 'x' });
      expect(sentMaxTokens(fetchFn)).toBe(MAX_OUTPUT_TOKENS);
    });
  });

  describe('validation', () => {
    it.each([
      ['not JSON', '{nope'],
      ['a JSON array', []],
      ['null', 'null'],
      ['a missing prompt', {}],
      ['a non-string prompt', { prompt: 5 }],
      ['an empty prompt', { prompt: '  ' }],
      ['a non-boolean json flag', { prompt: 'x', json: 'yes' }],
      ['a non-numeric maxTokens', { prompt: 'x', maxTokens: 'lots' }],
      ['a zero maxTokens', { prompt: 'x', maxTokens: 0 }],
      ['a negative maxTokens', { prompt: 'x', maxTokens: -5 }],
    ])('rejects %s with 400 and never calls upstream', async (_label, body) => {
      const { post, fetchFn } = setup();
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'bad_request' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('accepts a prompt of exactly the maximum length', async () => {
      const { post } = setup();
      const res = await post({ prompt: 'a'.repeat(MAX_PROMPT_CHARS) });
      expect(res.status).toBe(200);
    });

    it('rejects a prompt over 8,000 characters with 413', async () => {
      const { post, fetchFn } = setup();
      const res = await post({ prompt: 'a'.repeat(MAX_PROMPT_CHARS + 1) });
      expect(res.status).toBe(413);
      expect(await res.json()).toEqual({ error: 'prompt_too_large' });
      expect(MAX_PROMPT_CHARS).toBe(8000);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('rejects an oversized raw body with 413 before parsing it', async () => {
      const { post, fetchFn } = setup();
      const res = await post('x'.repeat(100_000));
      expect(res.status).toBe(413);
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('method guard', () => {
    it.each(['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])('answers %s with 405 and an Allow header', async (method) => {
      const { handler, fetchFn } = setup();
      const res = await handler(new Request('https://proxy.test/api/complete', { method }));
      expect(res.status).toBe(405);
      expect(res.headers.get('allow')).toBe('POST');
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('answers 429 with Retry-After once an IP exceeds its budget', async () => {
      const { post, fetchFn } = setup({ limit: 2 });
      expect((await post({ prompt: 'x' })).status).toBe(200);
      expect((await post({ prompt: 'x' })).status).toBe(200);
      const res = await post({ prompt: 'x' });
      expect(res.status).toBe(429);
      expect(res.headers.get('retry-after')).toBe('300');
      expect(await res.json()).toEqual({ error: 'rate_limited' });
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('limits per IP, using the first x-forwarded-for entry', async () => {
      const { post } = setup({ limit: 1 });
      expect((await post({ prompt: 'x' }, { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' })).status).toBe(200);
      expect((await post({ prompt: 'x' }, { 'x-forwarded-for': '9.9.9.9, 10.0.0.2' })).status).toBe(429);
      expect((await post({ prompt: 'x' }, { 'x-forwarded-for': '8.8.8.8' })).status).toBe(200);
    });

    it('falls back to x-real-ip, then to a shared bucket', async () => {
      const { post } = setup({ limit: 1 });
      expect((await post({ prompt: 'x' }, { 'x-forwarded-for': '', 'x-real-ip': '7.7.7.7' })).status).toBe(200);
      expect((await post({ prompt: 'x' }, { 'x-forwarded-for': '', 'x-real-ip': '7.7.7.7' })).status).toBe(429);
      expect((await post({ prompt: 'x' }, { 'x-forwarded-for': '' })).status).toBe(200);
      expect((await post({ prompt: 'x' }, { 'x-forwarded-for': '' })).status).toBe(429);
    });

    it('lets requests through again after the bucket refills', async () => {
      const { post, advance } = setup({ limit: 1 });
      await post({ prompt: 'x' });
      expect((await post({ prompt: 'x' })).status).toBe(429);
      advance(600_000);
      expect((await post({ prompt: 'x' })).status).toBe(200);
    });
  });

  describe('upstream failures', () => {
    it('maps a non-OK upstream status to 502 without leaking the key or details', async () => {
      const fetchFn = jest.fn(async () => ({ ok: false, status: 403, json: async () => ({ error: SECRET }) })) as unknown as FetchMock;
      const { post } = setup({ fetch: fetchFn });
      const res = await post({ prompt: 'x' });
      const raw = await res.text();
      expect(res.status).toBe(502);
      expect(JSON.parse(raw)).toEqual({ error: 'upstream_error' });
      expect(raw).not.toContain(SECRET);
    });

    it('maps a network error to 502 without leaking the error message', async () => {
      const fetchFn = jest.fn(async () => {
        throw new Error(`connect failed for key ${SECRET}`);
      }) as unknown as FetchMock;
      const { post } = setup({ fetch: fetchFn });
      const res = await post({ prompt: 'x' });
      const raw = await res.text();
      expect(res.status).toBe(502);
      expect(raw).not.toContain(SECRET);
    });

    it('maps an upstream reply with no text to 502', async () => {
      const fetchFn = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ candidates: [] }) })) as unknown as FetchMock;
      const { post } = setup({ fetch: fetchFn });
      const res = await post({ prompt: 'x' });
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ error: 'upstream_empty' });
    });

    it('answers 500 server_misconfigured when GEMINI_API_KEY is missing, without calling upstream', async () => {
      const { post, fetchFn } = setup({ env: {} });
      const res = await post({ prompt: 'x' });
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'server_misconfigured' });
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('retry and diagnostics', () => {
    const status = (code: number) => ({ ok: code < 400, status: code, json: async () => ({ error: SECRET }) });
    const good = { ok: true, status: 200, json: async () => geminiReply('story') };
    const empty = { ok: true, status: 200, json: async () => ({ candidates: [] }) };
    const seq = (...replies: object[]) => {
      const queue = [...replies];
      return jest.fn(async () => queue.shift() ?? replies[replies.length - 1]) as unknown as FetchMock;
    };

    it.each([
      ['an empty reply', empty],
      ['a 500', status(500)],
      ['a 503', status(503)],
      ['a 429', status(429)],
    ])('retries once after %s and returns the second answer', async (_label, first) => {
      const fetchFn = seq(first, good);
      const res = await setup({ fetch: fetchFn }).post({ prompt: 'x' });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ text: 'story' });
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('gives up after one retry and answers the second failure', async () => {
      const fetchFn = seq(status(503), status(500));
      const res = await setup({ fetch: fetchFn }).post({ prompt: 'x' });
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ error: 'upstream_error' });
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it.each([400, 403, 404])('does not retry a %i', async (code) => {
      const fetchFn = seq(status(code), good);
      const res = await setup({ fetch: fetchFn }).post({ prompt: 'x' });
      expect(res.status).toBe(502);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('does not retry a timeout, which would exceed the function maxDuration', async () => {
      const fetchFn = jest.fn(async () => {
        throw new Error('aborted');
      }) as unknown as FetchMock;
      const res = await setup({ fetch: fetchFn }).post({ prompt: 'x' });
      expect(res.status).toBe(502);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('logs one structured line per failed attempt with code, status, attempt and ms', async () => {
      const logger = jest.fn();
      await setup({ fetch: seq(status(503), empty), logger }).post({ prompt: 'x' });
      expect(logger).toHaveBeenCalledTimes(2);
      expect(logger.mock.calls[0][0]).toEqual({ event: 'upstream_failure', code: 'upstream_error', status: 503, attempt: 1, ms: expect.any(Number) });
      expect(logger.mock.calls[1][0]).toEqual({ event: 'upstream_failure', code: 'upstream_empty', attempt: 2, ms: expect.any(Number) });
    });

    it('logs nothing on success', async () => {
      const logger = jest.fn();
      await setup({ logger }).post({ prompt: 'x' });
      expect(logger).not.toHaveBeenCalled();
    });

    it('never logs the key, the prompt or the upstream body', async () => {
      const logger = jest.fn();
      const fetchFn = jest.fn(async () => {
        throw new Error(`failed for ${SECRET} with PROMPT-TEXT`);
      }) as unknown as FetchMock;
      await setup({ fetch: seq(status(503), status(500)), logger }).post({ prompt: 'PROMPT-TEXT' });
      await setup({ fetch: fetchFn, logger }).post({ prompt: 'PROMPT-TEXT' });
      expect(logger).toHaveBeenCalled();
      const logged = JSON.stringify(logger.mock.calls);
      expect(logged).not.toContain(SECRET);
      expect(logged).not.toContain('PROMPT-TEXT');
      for (const [entry] of logger.mock.calls) {
        expect(Object.keys(entry).sort()).toEqual(expect.arrayContaining(['attempt', 'code', 'event', 'ms']));
        expect(Object.keys(entry).every((k) => ['event', 'code', 'status', 'attempt', 'ms'].includes(k))).toBe(true);
      }
    });
  });
});
