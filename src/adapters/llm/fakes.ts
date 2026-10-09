import type { LlmClient, LlmCompletionOptions } from '../../domain/ports';

type Call = { prompt: string; opts?: LlmCompletionOptions };

/** Test double: replies with queued responses (a string, or an Error to throw) and records prompts. */
export function fakeLlm(...replies: (string | Error)[]): LlmClient & { calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    async complete(prompt, opts) {
      calls.push({ prompt, opts });
      const reply = replies[Math.min(calls.length - 1, replies.length - 1)];
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
}
