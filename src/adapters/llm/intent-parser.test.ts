import { fakeLlm } from './fakes';
import { buildIntentPrompt, LlmIntentParser } from './intent-parser';

const request = '20 min walk, beginner, green areas';

describe('LlmIntentParser', () => {
  it('asks for strict JSON and includes the request in the prompt', async () => {
    const llm = fakeLlm('{}');
    await new LlmIntentParser(llm).parse(request);
    expect(llm.calls[0].opts?.json).toBe(true);
    expect(llm.calls[0].prompt).toContain(request);
    expect(llm.calls[0].prompt).toMatch(/durationMinutes/);
    expect(llm.calls[0].prompt).toMatch(/JSON/);
  });

  it('normalizes plain JSON output', async () => {
    const llm = fakeLlm('{"mode":"walk","durationMinutes":60,"level":"beginner","preferGreen":true}');
    const intent = await new LlmIntentParser(llm).parse(request);
    expect(intent.targetDistanceMeters).toBe(4000);
    expect(intent.preferences.preferGreen).toBe(true);
  });

  it('extracts fenced JSON wrapped in prose', async () => {
    const llm = fakeLlm('Here you go:\n```json\n{"mode":"run","distanceKm":6}\n```\nEnjoy!');
    const intent = await new LlmIntentParser(llm).parse(request);
    expect(intent.mode).toBe('run');
    expect(intent.targetDistanceMeters).toBe(6000);
  });

  it('clamps out-of-range values', async () => {
    const llm = fakeLlm('{"distanceKm":500,"checkpointCount":50}');
    const intent = await new LlmIntentParser(llm).parse(request);
    expect(intent.targetDistanceMeters).toBe(10000);
    expect(intent.checkpointCount).toBe(8);
  });

  it('falls back to defaults on garbage output', async () => {
    const intent = await new LlmIntentParser(fakeLlm('I cannot help with that.')).parse(request);
    expect(intent.targetDistanceMeters).toBe(3000);
    expect(intent.checkpointCount).toBe(5);
  });

  it('falls back to defaults when the model call fails', async () => {
    const intent = await new LlmIntentParser(fakeLlm(new Error('offline'))).parse(request);
    expect(intent.mode).toBe('walk');
    expect(intent.targetDistanceMeters).toBe(3000);
  });

  it('skips the model for an empty request', async () => {
    const llm = fakeLlm('{"distanceKm":9}');
    const intent = await new LlmIntentParser(llm).parse('   ');
    expect(llm.calls).toHaveLength(0);
    expect(intent.targetDistanceMeters).toBe(3000);
  });
});

describe('buildIntentPrompt', () => {
  const prompt = buildIntentPrompt('30 min walk, story themed on The Lord of the Rings');

  it('asks for a theme or a tone in storyStyle, with examples of both', () => {
    expect(prompt).toMatch(/"storyStyle": string \| null,\s+\/\/ theme or tone/);
    expect(prompt).toContain('The Lord of the Rings');
    expect(prompt).toMatch(/physics/i);
    expect(prompt).toMatch(/Bible/);
    expect(prompt).toMatch(/spooky/);
  });

  it('tells the model to keep the theme out of the route parameters', () => {
    expect(prompt).toMatch(/theme.*never.*(place|route)/is);
  });
});
