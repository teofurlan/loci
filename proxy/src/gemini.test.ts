/** @jest-environment node */
import { callGemini, GEMINI_API_BASE } from './gemini';

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
      generationConfig: { maxOutputTokens: 500 },
    });
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
});
