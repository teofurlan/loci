import { CooldownLlmClient } from '../adapters/llm';
import { OllamaClient } from '../adapters/llm/ollama';
import { ProxyLlmClient } from '../adapters/llm/proxy';
import { buildLlm } from './services';

const fetchFn = jest.fn();

describe('buildLlm', () => {
  it('does not wrap the proxy client, so each request is tried on its own merits', () => {
    const llm = buildLlm({ EXPO_PUBLIC_LLM_PROXY_URL: 'https://proxy.test' }, fetchFn);
    expect(llm).toBeInstanceOf(ProxyLlmClient);
    expect(llm).not.toBeInstanceOf(CooldownLlmClient);
  });

  it('wraps the Ollama client in a cooldown, because a dead host should be skipped', () => {
    const llm = buildLlm({}, fetchFn);
    expect(llm).toBeInstanceOf(CooldownLlmClient);
    expect(llm).not.toBeInstanceOf(OllamaClient);
  });
});
