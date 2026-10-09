import { resolveLlmConfig } from './config';

describe('resolveLlmConfig', () => {
  it('uses the proxy when EXPO_PUBLIC_LLM_PROXY_URL is set', () => {
    expect(resolveLlmConfig({ EXPO_PUBLIC_LLM_PROXY_URL: 'https://loci.vercel.app' })).toEqual({
      kind: 'proxy',
      baseUrl: 'https://loci.vercel.app',
    });
  });

  it('prefers the proxy over Ollama settings', () => {
    const cfg = resolveLlmConfig({ EXPO_PUBLIC_LLM_PROXY_URL: 'https://p.test', EXPO_PUBLIC_OLLAMA_URL: 'http://x' });
    expect(cfg.kind).toBe('proxy');
  });

  it('never resolves a direct Gemini key, even if one is present in the environment', () => {
    const cfg = resolveLlmConfig({ EXPO_PUBLIC_GEMINI_API_KEY: 'k' });
    expect(cfg.kind).toBe('ollama');
    expect(JSON.stringify(cfg)).not.toContain('"k"');
  });

  it('falls back to Ollama with defaults', () => {
    expect(resolveLlmConfig({})).toEqual({
      kind: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: 'gemma4:e4b',
    });
  });

  it('honours Ollama overrides and treats blank values as unset', () => {
    expect(
      resolveLlmConfig({
        EXPO_PUBLIC_LLM_PROXY_URL: '  ',
        EXPO_PUBLIC_OLLAMA_URL: 'http://10.0.2.2:11434',
        EXPO_PUBLIC_OLLAMA_MODEL: 'gemma4:26b',
      }),
    ).toEqual({ kind: 'ollama', baseUrl: 'http://10.0.2.2:11434', model: 'gemma4:26b' });
    expect(resolveLlmConfig({ EXPO_PUBLIC_OLLAMA_URL: '' })).toMatchObject({ baseUrl: 'http://localhost:11434' });
  });
});
