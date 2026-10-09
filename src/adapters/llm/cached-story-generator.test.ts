import type { StoryGenerator } from '../../domain/ports';
import type { Story } from '../../domain/story';
import type { Landmark } from '../../domain/types';
import { CachedStoryGenerator, InMemoryStoryCache } from './cached-story-generator';

const lm = (id: string, name: string): Landmark => ({ id, name, kind: 'park', position: { lat: 0, lng: 0 } });
const landmarks = [lm('node/1', 'A'), lm('node/2', 'B')];
const story = (title: string): Story => ({
  title,
  fragments: landmarks.map((l) => ({ landmarkId: l.id, text: `${title} ${l.name}` })),
});

function inner(...results: (Story | Error)[]): StoryGenerator {
  let count = 0;
  return {
    async generate() {
      const r = results[Math.min(count++, results.length - 1)];
      if (r instanceof Error) throw r;
      return r;
    },
  };
}

describe('CachedStoryGenerator', () => {
  it('stores successful stories and serves them when the inner generator later fails', async () => {
    const gen = new CachedStoryGenerator(inner(story('first'), new Error('quota')), new InMemoryStoryCache());
    const input = { landmarks, language: 'es' };
    expect((await gen.generate(input)).title).toBe('first');
    expect((await gen.generate(input)).title).toBe('first');
  });

  it('keys by landmark ids, style and language', async () => {
    const gen = new CachedStoryGenerator(inner(story('es-story'), new Error('down')), new InMemoryStoryCache());
    await gen.generate({ landmarks, language: 'es' });
    const other = await gen.generate({ landmarks, language: 'en', style: 'funny' });
    expect(other.title).not.toBe('es-story');
    expect(other.fragments[0].text).toMatch(/^At A/);
  });

  it('falls back to a deterministic template story when nothing is cached', async () => {
    const gen = new CachedStoryGenerator(inner(new Error('down')), new InMemoryStoryCache());
    const result = await gen.generate({ landmarks, language: 'es' });
    expect(result.fragments.map((f) => f.landmarkId)).toEqual(['node/1', 'node/2']);
    expect(result.fragments[0].text).toMatch(/^En A/);
  });

  it('never throws, even when the cache itself fails', async () => {
    const brokenCache = {
      get: async (): Promise<Story | undefined> => {
        throw new Error('disk');
      },
      set: async (): Promise<void> => {
        throw new Error('disk');
      },
    };
    const gen = new CachedStoryGenerator(inner(story('ok')), brokenCache);
    expect((await gen.generate({ landmarks, language: 'es' })).title).toBe('ok');
    const failing = new CachedStoryGenerator(inner(new Error('down')), brokenCache);
    expect((await failing.generate({ landmarks, language: 'es' })).fragments).toHaveLength(2);
  });
});
