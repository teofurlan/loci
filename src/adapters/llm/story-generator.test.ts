import type { Landmark } from '../../domain/types';
import { fakeLlm } from './fakes';
import { buildStoryPrompt, LlmStoryGenerator } from './story-generator';

const lm = (id: string, name: string, kind: Landmark['kind']): Landmark => ({
  id,
  name,
  kind,
  position: { lat: 1, lng: 2 },
});
const landmarks = [lm('node/1', 'Obelisco', 'monument'), lm('way/2', 'Rosedal', 'park')];

describe('buildStoryPrompt themes', () => {
  const themed = buildStoryPrompt({ landmarks, style: 'The Lord of the Rings', language: 'en' });

  it('weaves a requested theme through every fragment', () => {
    expect(themed).toContain('The Lord of the Rings');
    expect(themed).toMatch(/theme/i);
    expect(themed).toMatch(/every fragment/i);
  });

  it('still requires each place to be named and tied to the real landmark', () => {
    expect(themed).toContain('Obelisco');
    expect(themed).toContain('Rosedal');
    expect(themed).toMatch(/NAME of the (real )?place/);
    expect(themed).toMatch(/memory hook/i);
  });

  it('keeps the playful default when no style is asked for', () => {
    expect(buildStoryPrompt({ landmarks, language: 'en' })).toMatch(/playful and surreal/);
  });
});

describe('LlmStoryGenerator', () => {
  it('builds a prompt with names, kinds, ids, language and style, and asks for JSON', async () => {
    const llm = fakeLlm('{}');
    await new LlmStoryGenerator(llm).generate({ landmarks, style: 'spooky', language: 'es' });
    const { prompt, opts } = llm.calls[0];
    expect(opts?.json).toBe(true);
    expect(prompt).toContain('Obelisco');
    expect(prompt).toContain('monument');
    expect(prompt).toContain('way/2');
    expect(prompt).toContain('spooky');
    expect(prompt).toContain('Spanish');
    expect(prompt).toMatch(/aloud/);
  });

  it('never leaks coordinates to the model', async () => {
    const llm = fakeLlm('{}');
    await new LlmStoryGenerator(llm).generate({ landmarks, language: 'es' });
    expect(llm.calls[0].prompt).not.toMatch(/lat|lng/);
  });

  it('returns the model fragments in landmark order', async () => {
    const llm = fakeLlm(
      '```json\n{"title":"T","fragments":[{"landmarkId":"way/2","text":"rosas"},{"landmarkId":"node/1","text":"aguja"}]}\n```',
    );
    const story = await new LlmStoryGenerator(llm).generate({ landmarks, language: 'es' });
    expect(story.title).toBe('T');
    expect(story.fragments).toEqual([
      { landmarkId: 'node/1', text: 'aguja' },
      { landmarkId: 'way/2', text: 'rosas' },
    ]);
  });

  it('drops unknown ids and fills missing landmarks with a template fragment', async () => {
    const llm = fakeLlm(
      '{"title":"T","fragments":[{"landmarkId":"node/9","text":"x"},{"landmarkId":"node/1","text":"aguja"}]}',
    );
    const story = await new LlmStoryGenerator(llm).generate({ landmarks, language: 'es' });
    expect(story.fragments.map((f) => f.landmarkId)).toEqual(['node/1', 'way/2']);
    expect(story.fragments[1].text).toContain('Rosedal');
  });

  it('propagates model failures so a decorator can handle them', async () => {
    await expect(
      new LlmStoryGenerator(fakeLlm(new Error('boom'))).generate({ landmarks, language: 'es' }),
    ).rejects.toThrow('boom');
  });

  it('returns a template story on unparseable output', async () => {
    const story = await new LlmStoryGenerator(fakeLlm('nope')).generate({ landmarks, language: 'en' });
    expect(story.fragments).toHaveLength(2);
    expect(story.fragments[0].text).toMatch(/^At Obelisco/);
  });
});
