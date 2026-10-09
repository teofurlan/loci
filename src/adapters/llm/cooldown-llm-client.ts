import type { LlmClient, LlmCompletionOptions } from '../../domain/ports';

export type CooldownOptions = {
  cooldownMs: number;
  now?: () => number;
};

/**
 * After a failed call, fails fast with the same error for `cooldownMs`. A dead or unreachable
 * model would otherwise cost a full timeout for every call in a plan (intent, then story).
 */
export class CooldownLlmClient implements LlmClient {
  private failure: { error: unknown; at: number } | undefined;

  constructor(
    private readonly inner: LlmClient,
    private readonly options: CooldownOptions,
  ) {}

  async complete(prompt: string, opts?: LlmCompletionOptions): Promise<string> {
    const now = this.options.now ?? Date.now;
    if (this.failure && now() - this.failure.at < this.options.cooldownMs) throw this.failure.error;
    try {
      const text = await this.inner.complete(prompt, opts);
      this.failure = undefined;
      return text;
    } catch (error) {
      this.failure = { error, at: now() };
      throw error;
    }
  }
}
