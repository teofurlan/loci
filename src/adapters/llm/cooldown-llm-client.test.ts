import type { LlmClient } from '../../domain/ports';
import { CooldownLlmClient } from './cooldown-llm-client';

function clientThat(...results: (string | Error)[]) {
  const complete = jest.fn(async () => {
    const next = results.shift();
    if (next instanceof Error) throw next;
    return next ?? 'ok';
  });
  return { complete } as LlmClient & { complete: jest.Mock };
}

describe('CooldownLlmClient', () => {
  it('passes calls through while the model works', async () => {
    const inner = clientThat('a', 'b');
    const llm = new CooldownLlmClient(inner, { cooldownMs: 1000, now: () => 0 });
    await expect(llm.complete('p')).resolves.toBe('a');
    await expect(llm.complete('p')).resolves.toBe('b');
    expect(inner.complete).toHaveBeenCalledTimes(2);
  });

  it('fails fast with the last error during the cooldown after a failure', async () => {
    const boom = new Error('boom');
    const inner = clientThat(boom, 'late');
    let now = 0;
    const llm = new CooldownLlmClient(inner, { cooldownMs: 1000, now: () => now });
    await expect(llm.complete('p')).rejects.toBe(boom);
    now = 999;
    await expect(llm.complete('p')).rejects.toBe(boom);
    expect(inner.complete).toHaveBeenCalledTimes(1);
  });

  it('tries the model again once the cooldown has passed', async () => {
    const inner = clientThat(new Error('boom'), 'back');
    let now = 0;
    const llm = new CooldownLlmClient(inner, { cooldownMs: 1000, now: () => now });
    await expect(llm.complete('p')).rejects.toThrow('boom');
    now = 1000;
    await expect(llm.complete('p')).resolves.toBe('back');
  });
});
