/** @jest-environment node */
import { callGemini, DEFAULT_UPSTREAM_TIMEOUT_MS, UpstreamError, GEMINI_API_BASE, THINKING_HEADROOM_TOKENS } from './gemini';

const okFetch = (body: unknown) =>
  jest.fn(async (_url: string, _init: any) => ({ ok: true, status: 200, json: async () => body }));
const reply = (...parts: object[]) => ({ candidates: [{ content: { parts, role: 'model' } }] });
const config = (fetchFn: unknown, extra: object = {}) => ({
  fetch: fetchFn as never,
  apiKey: 'SECRET',
  model: 'gemma-4-26b-a4b-it',
  ...extra,
});

describe('callGemini', () => {
  it('posts to generateContent with the key in a header, not the URL', async () => {
    const fetchFn = okFetch(reply({ text: 'hello' }));
    const text = await callGemini(config(fetchFn), 'hi', 500);

    expect(text).toBe('hello');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${GEMINI_API_BASE}/models/gemma-4-26b-a4b-it:generateContent`);
    expect(url).not.toContain('SECRET');
    expect(init.method).toBe('POST');
    expect(init.headers['x-goog-api-key']).toBe('SECRET');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({
      contents: [{ parts: [{ text: 'hi' }] }],
      generationConfig: { maxOutputTokens: 500 + THINKING_HEADROOM_TOKENS },
    });
  });

  it('adds thinking headroom so Gemma 4 reasoning cannot starve the visible answer', () => {
    // Observed in production: a 300-token budget returned no text because thinking used it all.
    expect(THINKING_HEADROOM_TOKENS).toBe(2048);
  });

  it('omits generationConfig when no token cap is given', async () => {
    const fetchFn = okFetch(reply({ text: '{}' }));
    await callGemini(config(fetchFn), 'hi');
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).not.toHaveProperty('generationConfig');
  });

  it('joins text parts and skips thought parts', async () => {
    const fetchFn = okFetch(reply({ text: 'thinking...', thought: true }, { text: 'a' }, { text: 'b' }));
    expect(await callGemini(config(fetchFn), 'hi')).toBe('ab');
  });

  it('throws on a non-OK status without echoing the key', async () => {
    const fetchFn = jest.fn(async () => ({ ok: false, status: 429, json: async () => ({}) }));
    const error = await callGemini(config(fetchFn), 'x').catch((e: Error) => e);
    expect((error as Error).message).toContain('429');
    expect((error as Error).message).not.toContain('SECRET');
  });

  it('carries the upstream HTTP status on UpstreamError, never the body', async () => {
    const fetchFn = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({ error: 'SECRET-BODY' }) }));
    const error = (await callGemini(config(fetchFn), 'x').catch((e: unknown) => e)) as UpstreamError;
    expect(error).toBeInstanceOf(UpstreamError);
    expect(error.code).toBe('upstream_error');
    expect(error.status).toBe(503);
    expect(JSON.stringify(error)).not.toContain('SECRET-BODY');
  });

  it('leaves the status undefined when the model returns no text', async () => {
    const error = (await callGemini(config(okFetch({ candidates: [] })), 'x').catch((e: unknown) => e)) as UpstreamError;
    expect(error.code).toBe('upstream_empty');
    expect(error.status).toBeUndefined();
  });

  it('throws when the model returns no text (for example, blocked)', async () => {
    const fetchFn = okFetch({ candidates: [], promptFeedback: { blockReason: 'SAFETY' } });
    await expect(callGemini(config(fetchFn), 'x')).rejects.toThrow(/no text/);
  });

  it('aborts the request when the timeout elapses', async () => {
    const fetchFn = jest.fn(
      (_url: string, init: any) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    await expect(callGemini(config(fetchFn, { timeoutMs: 10 }), 'x')).rejects.toThrow('aborted');
  });

  it('allows the upstream 110 seconds by default, inside the 120 second function limit', () => {
    expect(DEFAULT_UPSTREAM_TIMEOUT_MS).toBe(110_000);
  });

  describe('thinkingLevel', () => {
    it('sends thinkingConfig next to maxOutputTokens when configured', async () => {
      const fetchFn = okFetch(reply({ text: 'ok' }));
      await callGemini(config(fetchFn, { thinkingLevel: 'MINIMAL' }), 'hi', 500);
      expect(JSON.parse(fetchFn.mock.calls[0][1].body).generationConfig).toEqual({
        maxOutputTokens: 500 + THINKING_HEADROOM_TOKENS,
        thinkingConfig: { thinkingLevel: 'MINIMAL' },
      });
    });

    it('creates generationConfig when only thinkingLevel is present', async () => {
      const fetchFn = okFetch(reply({ text: 'ok' }));
      await callGemini(config(fetchFn, { thinkingLevel: 'MINIMAL' }), 'hi');
      expect(JSON.parse(fetchFn.mock.calls[0][1].body).generationConfig).toEqual({
        thinkingConfig: { thinkingLevel: 'MINIMAL' },
      });
    });

    it('sends no thinkingConfig when unset', async () => {
      const fetchFn = okFetch(reply({ text: 'ok' }));
      await callGemini(config(fetchFn), 'hi', 500);
      expect(JSON.parse(fetchFn.mock.calls[0][1].body).generationConfig).not.toHaveProperty('thinkingConfig');
    });
  });
});
