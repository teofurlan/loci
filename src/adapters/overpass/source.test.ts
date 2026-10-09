import fixture from './__fixtures__/buenos-aires.json';
import { OverpassLandmarkSource } from './source';

const center = { lat: -34.6037, lng: -58.3816 };

describe('OverpassLandmarkSource', () => {
  it('posts the query to the endpoint with identifying headers and parses landmarks', async () => {
    const fetchFn = jest.fn(async (_url: string, _init: any) => ({
      ok: true,
      status: 200,
      json: async () => fixture,
    }));
    const source = new OverpassLandmarkSource({
      fetch: fetchFn as never,
      endpoint: 'https://overpass.test/api/interpreter',
      userAgent: 'Loci/1.0 (test)',
    });
    const landmarks = await source.findNear(center, 1500);

    expect(landmarks.length).toBeGreaterThan(5);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://overpass.test/api/interpreter');
    expect(init.method).toBe('POST');
    expect(init.headers['User-Agent']).toBe('Loci/1.0 (test)');
    expect(decodeURIComponent(init.body)).toContain('around:1500,-34.6037,-58.3816');
    expect(init.signal).toBeDefined();
  });

  it('throws on a non-OK response', async () => {
    const fetchFn = jest.fn(async () => ({ ok: false, status: 429, json: async () => ({}) }));
    const source = new OverpassLandmarkSource({
      fetch: fetchFn as never,
      endpoint: 'x',
      userAgent: 'u',
    });
    await expect(source.findNear(center, 500)).rejects.toThrow('429');
  });

  it('aborts when the request exceeds the timeout', async () => {
    const fetchFn = jest.fn(
      (_url: string, init: any) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const source = new OverpassLandmarkSource({
      fetch: fetchFn as never,
      endpoint: 'x',
      userAgent: 'u',
      timeoutMs: 10,
    });
    await expect(source.findNear(center, 500)).rejects.toThrow('aborted');
  });
});
