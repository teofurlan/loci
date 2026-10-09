import { resolveLlmConfig } from './config';

describe('resolveLlmConfig', () => {
  it('uses Gemma on the Gemini API when a key is present', () => {
    expect(resolveLlmConfig({ EXPO_PUBLIC_GEMINI_API_KEY: 'k' })).toEqual({
      kind: 'gemini',
      apiKey: 'k',
      model: 'gemma-4-26b-a4b-it',
    });
  });

  it('prefers Gemini over Ollama settings', () => {
    const cfg = resolveLlmConfig({ EXPO_PUBLIC_GEMINI_API_KEY: 'k', EXPO_PUBLIC_OLLAMA_URL: 'http://x' });
    expect(cfg.kind).toBe('gemini');
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
        EXPO_PUBLIC_GEMINI_API_KEY: '  ',
        EXPO_PUBLIC_OLLAMA_URL: 'http://10.0.2.2:11434',
        EXPO_PUBLIC_OLLAMA_MODEL: 'gemma4:26b',
      }),
    ).toEqual({ kind: 'ollama', baseUrl: 'http://10.0.2.2:11434', model: 'gemma4:26b' });
    expect(resolveLlmConfig({ EXPO_PUBLIC_OLLAMA_URL: '' })).toMatchObject({ baseUrl: 'http://localhost:11434' });
  });
});
