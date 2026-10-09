import { normalizeStory, templateStory } from './story';
import type { Landmark } from './types';

const lm = (id: string, name: string, kind: Landmark['kind'] = 'monument'): Landmark => ({
  id,
  name,
  kind,
  position: { lat: 0, lng: 0 },
});
const landmarks = [lm('node/1', 'Obelisco'), lm('way/2', 'Plaza Italia', 'square'), lm('node/3', 'Rosedal', 'park')];

describe('templateStory', () => {
  it('has one fragment per landmark, in order, mentioning its name', () => {
    const story = templateStory(landmarks, 'es');
    expect(story.fragments.map((f) => f.landmarkId)).toEqual(['node/1', 'way/2', 'node/3']);
    story.fragments.forEach((f, i) => expect(f.text).toContain(landmarks[i].name));
    expect(story.title.length).toBeGreaterThan(0);
  });

  it('speaks the requested language and falls back to English', () => {
    expect(templateStory(landmarks, 'es').fragments[0].text).toMatch(/^En Obelisco/);
    expect(templateStory(landmarks, 'en').fragments[0].text).toMatch(/^At Obelisco/);
    expect(templateStory(landmarks, 'xx').fragments[0].text).toMatch(/^At Obelisco/);
  });
});

describe('normalizeStory', () => {
  it('keeps valid fragments reordered to the landmark order', () => {
    const story = normalizeStory(
      {
        title: ' Mi historia ',
        fragments: [
          { landmarkId: 'node/3', text: 'tres' },
          { landmarkId: 'node/1', text: 'uno' },
          { landmarkId: 'way/2', text: 'dos' },
        ],
      },
      landmarks,
      'es',
    );
    expect(story.title).toBe('Mi historia');
    expect(story.fragments.map((f) => f.text)).toEqual(['uno', 'dos', 'tres']);
  });

  it('drops unknown ids and duplicates, and fills missing landmarks from the template', () => {
    const story = normalizeStory(
      {
        title: 't',
        fragments: [
          { landmarkId: 'node/999', text: 'invented' },
          { landmarkId: 'node/1', text: 'first' },
          { landmarkId: 'node/1', text: 'second' },
        ],
      },
      landmarks,
      'en',
    );
    expect(story.fragments.map((f) => f.landmarkId)).toEqual(['node/1', 'way/2', 'node/3']);
    expect(story.fragments[0].text).toBe('first');
    expect(story.fragments[1].text).toMatch(/^At Plaza Italia/);
    expect(JSON.stringify(story)).not.toContain('invented');
  });

  it('ignores empty or non-string text and survives garbage', () => {
    const garbage = [
      undefined,
      null,
      5,
      'x',
      [],
      { fragments: 'no' },
      { fragments: [null, 1, { landmarkId: 'node/1', text: '  ' }] },
    ];
    for (const raw of garbage) {
      const story = normalizeStory(raw, landmarks, 'en');
      expect(story.fragments).toHaveLength(3);
      expect(story.fragments[0].text).toMatch(/^At Obelisco/);
      expect(story.title.length).toBeGreaterThan(0);
    }
  });
});
