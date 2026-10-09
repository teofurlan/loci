import { ProxyLlmClient } from './proxy';

const okFetch = (body: unknown) =>
  jest.fn(async (_url: string, _init: any) => ({ ok: true, status: 200, json: async () => body }));

describe('ProxyLlmClient', () => {
  it('posts the prompt and options to /api/complete and returns the text', async () => {
    const fetchFn = okFetch({ text: 'hello' });
    const client = new ProxyLlmClient({ fetch: fetchFn as never, baseUrl: 'https://loci.vercel.app' });
    const text = await client.complete('hi', { json: true, maxTokens: 300 });

    expect(text).toBe('hello');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://loci.vercel.app/api/complete');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ prompt: 'hi', json: true, maxTokens: 300 });
  });

  it('omits options that were not given', async () => {
    const fetchFn = okFetch({ text: 'x' });
    await new ProxyLlmClient({ fetch: fetchFn as never, baseUrl: 'https://p.test' }).complete('hi');
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ prompt: 'hi' });
  });

  it('tolerates trailing slashes in the base URL', async () => {
    const fetchFn = okFetch({ text: 'x' });
    await new ProxyLlmClient({ fetch: fetchFn as never, baseUrl: 'https://p.test//' }).complete('hi');
    expect(fetchFn.mock.calls[0][0]).toBe('https://p.test/api/complete');
  });

  it('throws on a non-OK status, naming the status only', async () => {
    const fetchFn = jest.fn(async () => ({ ok: false, status: 429, json: async () => ({ error: 'rate_limited' }) }));
    await expect(new ProxyLlmClient({ fetch: fetchFn as never, baseUrl: 'https://p.test' }).complete('x')).rejects.toThrow(
      'LLM proxy request failed with status 429',
    );
  });

  it.each([[{}], [{ text: 5 }], [{ text: '' }], [null]])('throws when the reply has no text (%j)', async (body) => {
    const fetchFn = okFetch(body);
    await expect(new ProxyLlmClient({ fetch: fetchFn as never, baseUrl: 'https://p.test' }).complete('x')).rejects.toThrow(
      /no text/,
    );
  });

  it('aborts when the timeout elapses', async () => {
    const fetchFn = jest.fn(
      (_url: string, init: any) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const client = new ProxyLlmClient({ fetch: fetchFn as never, baseUrl: 'https://p.test', timeoutMs: 10 });
    await expect(client.complete('x')).rejects.toThrow('aborted');
  });
});
