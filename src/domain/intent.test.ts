import { normalizeIntent } from './intent';

describe('normalizeIntent', () => {
  it('returns safe defaults for garbage input', () => {
    for (const raw of [undefined, null, 42, 'walk', [], { mode: 7 }]) {
      const intent = normalizeIntent(raw);
      expect(intent.mode).toBe('walk');
      expect(intent.targetDistanceMeters).toBe(3000);
      expect(intent.checkpointCount).toBe(5);
      expect(intent.preferences).toEqual({ preferGreen: false, preferRecognizable: false });
      expect(intent.storyStyle).toBeUndefined();
      expect(intent.notes).toBe('');
    }
  });

  it('defaults to 5 km for a run without a request', () => {
    expect(normalizeIntent({ mode: 'run' }).targetDistanceMeters).toBe(5000);
  });

  it('converts duration to distance using the mode pace', () => {
    expect(normalizeIntent({ mode: 'walk', durationMinutes: 60 }).targetDistanceMeters).toBe(5000);
    expect(normalizeIntent({ mode: 'run', durationMinutes: 40 }).targetDistanceMeters).toBe(6000);
  });

  it('slows the pace for beginners', () => {
    const intent = normalizeIntent({ mode: 'walk', durationMinutes: 60, level: 'beginner' });
    expect(intent.targetDistanceMeters).toBe(4000);
  });

  it('prefers an explicit distance over a duration', () => {
    const intent = normalizeIntent({ distanceKm: 2, durationMinutes: 120 });
    expect(intent.targetDistanceMeters).toBe(2000);
  });

  it('clamps distance to 1-10 km', () => {
    expect(normalizeIntent({ distanceKm: 0.1 }).targetDistanceMeters).toBe(1000);
    expect(normalizeIntent({ distanceKm: 80 }).targetDistanceMeters).toBe(10000);
    expect(normalizeIntent({ durationMinutes: 600, mode: 'run' }).targetDistanceMeters).toBe(10000);
  });

  it('ignores non-finite or non-positive numbers', () => {
    expect(normalizeIntent({ distanceKm: -3 }).targetDistanceMeters).toBe(3000);
    expect(normalizeIntent({ distanceKm: '5' }).targetDistanceMeters).toBe(3000);
    expect(normalizeIntent({ durationMinutes: Infinity }).targetDistanceMeters).toBe(3000);
    expect(normalizeIntent({ durationMinutes: NaN }).targetDistanceMeters).toBe(3000);
  });

  it('derives about one checkpoint per 700 m, clamped to 4-8', () => {
    expect(normalizeIntent({ distanceKm: 1 }).checkpointCount).toBe(4);
    expect(normalizeIntent({ distanceKm: 5 }).checkpointCount).toBe(7);
    expect(normalizeIntent({ distanceKm: 10 }).checkpointCount).toBe(8);
  });

  it('clamps an explicit checkpoint count and rounds it', () => {
    expect(normalizeIntent({ checkpointCount: 2 }).checkpointCount).toBe(4);
    expect(normalizeIntent({ checkpointCount: 99 }).checkpointCount).toBe(8);
    expect(normalizeIntent({ checkpointCount: 6.4 }).checkpointCount).toBe(6);
  });

  it('reads preferences only when they are booleans', () => {
    const intent = normalizeIntent({ preferGreen: true, preferRecognizable: 'yes' });
    expect(intent.preferences).toEqual({ preferGreen: true, preferRecognizable: false });
  });

  it('keeps a trimmed, bounded story style and notes', () => {
    const intent = normalizeIntent({ storyStyle: '  funny  ', notes: 'x'.repeat(1000) });
    expect(intent.storyStyle).toBe('funny');
    expect(intent.notes).toHaveLength(300);
    expect(normalizeIntent({ storyStyle: '   ' }).storyStyle).toBeUndefined();
  });

  it('rejects unknown modes', () => {
    expect(normalizeIntent({ mode: 'fly' }).mode).toBe('walk');
  });
});
