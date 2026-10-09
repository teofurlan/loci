import { OllamaClient } from './ollama';

const okFetch = (body: unknown) =>
  jest.fn(async (_url: string, _init: any) => ({ ok: true, status: 200, json: async () => body }));

describe('OllamaClient', () => {
  it('posts to /api/generate with stream disabled and json format', async () => {
    const fetchFn = okFetch({ response: '{"a":1}', done: true });
    const client = new OllamaClient({ fetch: fetchFn as never });
    const text = await client.complete('hi', { json: true, maxTokens: 123 });

    expect(text).toBe('{"a":1}');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('http://localhost:11434/api/generate');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      model: 'gemma3:4b',
      prompt: 'hi',
      stream: false,
      format: 'json',
      options: { num_predict: 123 },
    });
    expect(init.signal).toBeDefined();
  });

  it('omits format and options when not requested, and honors baseUrl and model', async () => {
    const fetchFn = okFetch({ response: 'text' });
    const client = new OllamaClient({
      fetch: fetchFn as never,
      baseUrl: 'http://10.0.2.2:11434/',
      model: 'gemma4:e4b',
    });
    await client.complete('hi');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('http://10.0.2.2:11434/api/generate');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('gemma4:e4b');
    expect(body).not.toHaveProperty('format');
    expect(body).not.toHaveProperty('options');
  });

  it('throws on a non-OK status', async () => {
    const fetchFn = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    await expect(new OllamaClient({ fetch: fetchFn as never }).complete('x')).rejects.toThrow('500');
  });

  it('throws when the response has no text', async () => {
    const client = new OllamaClient({ fetch: okFetch({ done: true }) as never });
    await expect(client.complete('x')).rejects.toThrow(/response/);
  });
});
