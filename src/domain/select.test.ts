import { offsetMeters } from './geo';
import { selectCheckpoints } from './select';
import type { Landmark, LandmarkKind, LatLng, Rng, RoutePreferences } from './types';

const origin: LatLng = { lat: -34.6037, lng: -58.3816 };
const noPrefs: RoutePreferences = { preferGreen: false, preferRecognizable: false };

function seeded(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lm(id: string, north: number, east: number, kind: LandmarkKind = 'other'): Landmark {
  return { id, name: `Place ${id}`, kind, position: offsetMeters(origin, north, east) };
}

const base = {
  preferences: noPrefs,
  visitedIds: new Set<string>() as ReadonlySet<string>,
  familiarRatio: 0,
  snapRadiusMeters: 200,
};

describe('selectCheckpoints', () => {
  it('snaps each candidate to the nearest landmark within the radius', () => {
    const landmarks = [lm('a', 10, 0), lm('b', 100, 0), lm('c', 1000, 0)];
    const candidates = [offsetMeters(origin, 0, 0), offsetMeters(origin, 1000, 20)];
    const { checkpoints, unmatched } = selectCheckpoints({
      ...base,
      candidates,
      landmarks,
      rng: seeded(1),
    });
    expect(checkpoints.map((c) => c.id)).toEqual(['a', 'c']);
    expect(unmatched).toBe(0);
  });

  it('never picks the same landmark twice', () => {
    const landmarks = [lm('a', 0, 0), lm('b', 50, 0)];
    const candidates = [origin, origin];
    const { checkpoints } = selectCheckpoints({ ...base, candidates, landmarks, rng: seeded(1) });
    expect(new Set(checkpoints.map((c) => c.id)).size).toBe(checkpoints.length);
    expect(checkpoints).toHaveLength(2);
  });

  it('reports unmatched candidates with no landmark in range', () => {
    const landmarks = [lm('a', 0, 0), lm('far', 5000, 0)];
    const candidates = [origin, offsetMeters(origin, 0, 2000)];
    const { checkpoints, unmatched } = selectCheckpoints({
      ...base,
      candidates,
      landmarks,
      rng: seeded(1),
    });
    expect(checkpoints.map((c) => c.id)).toEqual(['a']);
    expect(unmatched).toBe(1);
  });

  it('reports every candidate as unmatched when there are not enough landmarks', () => {
    const { checkpoints, unmatched } = selectCheckpoints({
      ...base,
      candidates: [origin, origin, origin],
      landmarks: [lm('a', 0, 0)],
      rng: seeded(1),
    });
    expect(checkpoints).toHaveLength(1);
    expect(unmatched).toBe(2);
  });

  it('lets the preference boost change the choice', () => {
    const landmarks = [lm('plain', 10, 0, 'library'), lm('park', 60, 0, 'park')];
    const args = { ...base, candidates: [origin], landmarks, rng: seeded(1) };
    expect(selectCheckpoints(args).checkpoints[0].id).toBe('plain');
    const green = selectCheckpoints({
      ...args,
      preferences: { preferGreen: true, preferRecognizable: false },
    });
    expect(green.checkpoints[0].id).toBe('park');
  });

  it('boosts recognizable kinds when preferRecognizable is set', () => {
    const landmarks = [lm('lib', 10, 0, 'library'), lm('fountain', 60, 0, 'fountain')];
    const out = selectCheckpoints({
      ...base,
      candidates: [origin],
      landmarks,
      preferences: { preferGreen: false, preferRecognizable: true },
      rng: seeded(1),
    });
    expect(out.checkpoints[0].id).toBe('fountain');
  });

  it('mixes familiar and new landmarks by the requested ratio', () => {
    const candidates = Array.from({ length: 5 }, () => origin);
    const landmarks = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((id, i) =>
      lm(id, i * 10, 0),
    );
    const visitedIds = new Set(['f', 'g', 'h', 'i', 'j']);
    const { checkpoints } = selectCheckpoints({
      ...base,
      candidates,
      landmarks,
      visitedIds,
      familiarRatio: 0.4,
      rng: seeded(3),
    });
    expect(checkpoints).toHaveLength(5);
    expect(checkpoints.filter((c) => visitedIds.has(c.id))).toHaveLength(2);
  });

  it('fills with new landmarks when not enough familiar ones are available', () => {
    const candidates = Array.from({ length: 4 }, () => origin);
    const landmarks = ['a', 'b', 'c', 'd', 'e'].map((id, i) => lm(id, i * 10, 0));
    const { checkpoints } = selectCheckpoints({
      ...base,
      candidates,
      landmarks,
      visitedIds: new Set(['a']),
      familiarRatio: 0.75,
      rng: seeded(3),
    });
    expect(checkpoints).toHaveLength(4);
    expect(checkpoints.filter((c) => c.id === 'a')).toHaveLength(1);
  });

  it('is deterministic for the same seed and breaks ties through the rng', () => {
    const landmarks = [lm('a', 30, 0), lm('b', -30, 0), lm('c', 0, 30), lm('d', 0, -30)];
    const run = (seed: number) =>
      selectCheckpoints({ ...base, candidates: [origin], landmarks, rng: seeded(seed) })
        .checkpoints[0].id;
    expect(run(7)).toBe(run(7));
    const picks = new Set(Array.from({ length: 30 }, (_, i) => run(i + 1)));
    expect(picks.size).toBeGreaterThan(1);
  });
});
