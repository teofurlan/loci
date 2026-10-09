import { GeminiApiClient } from './gemini';

const okFetch = (body: unknown) =>
  jest.fn(async (_url: string, _init: any) => ({ ok: true, status: 200, json: async () => body }));
const reply = (...parts: object[]) => ({ candidates: [{ content: { parts, role: 'model' } }] });

describe('GeminiApiClient', () => {
  it('posts to generateContent with the key in a header, not the URL', async () => {
    const fetchFn = okFetch(reply({ text: 'hello' }));
    const client = new GeminiApiClient({ fetch: fetchFn as never, apiKey: 'SECRET', model: 'gemma-4-26b-a4b-it' });
    const text = await client.complete('hi', { maxTokens: 500 });

    expect(text).toBe('hello');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent');
    expect(url).not.toContain('SECRET');
    expect(init.headers['x-goog-api-key']).toBe('SECRET');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({
      contents: [{ parts: [{ text: 'hi' }] }],
      generationConfig: { maxOutputTokens: 500 },
    });
  });

  it('sends no JSON-mode fields (undocumented for Gemma); json stays prompt-level', async () => {
    const fetchFn = okFetch(reply({ text: '{}' }));
    await new GeminiApiClient({ fetch: fetchFn as never, apiKey: 'k' }).complete('hi', { json: true });
    const body = JSON.parse(fetchFn.mock.calls[0][1].body);
    expect(JSON.stringify(body)).not.toMatch(/responseMimeType|responseSchema/);
    expect(body).not.toHaveProperty('generationConfig');
  });

  it('joins text parts and skips thought parts', async () => {
    const fetchFn = okFetch(reply({ text: 'thinking...', thought: true }, { text: 'a' }, { text: 'b' }));
    const text = await new GeminiApiClient({ fetch: fetchFn as never, apiKey: 'k' }).complete('hi');
    expect(text).toBe('ab');
  });

  it('throws on a non-OK status without echoing the key', async () => {
    const fetchFn = jest.fn(async () => ({ ok: false, status: 429, json: async () => ({}) }));
    const error = await new GeminiApiClient({ fetch: fetchFn as never, apiKey: 'SECRET' })
      .complete('x')
      .catch((e: Error) => e);
    expect((error as Error).message).toContain('429');
    expect((error as Error).message).not.toContain('SECRET');
  });

  it('throws when the model returns no text (for example, blocked)', async () => {
    const fetchFn = okFetch({ candidates: [], promptFeedback: { blockReason: 'SAFETY' } });
    await expect(new GeminiApiClient({ fetch: fetchFn as never, apiKey: 'k' }).complete('x')).rejects.toThrow(/text/);
  });
});
