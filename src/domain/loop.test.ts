import { haversineMeters } from './geo';
import { generateLoopCandidates } from './loop';
import type { LatLng, Rng } from './types';

const origin: LatLng = { lat: -34.6037, lng: -58.3816 };

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

function loopLength(points: readonly LatLng[]): number {
  const path = [origin, ...points, origin];
  let total = 0;
  for (let i = 1; i < path.length; i++) total += haversineMeters(path[i - 1], path[i]);
  return total;
}

describe('generateLoopCandidates', () => {
  it('returns the requested number of points', () => {
    const pts = generateLoopCandidates({
      origin,
      targetDistanceMeters: 3000,
      count: 6,
      rng: seeded(1),
    });
    expect(pts).toHaveLength(6);
  });

  it('is deterministic for the same seed and differs across seeds', () => {
    const args = { origin, targetDistanceMeters: 3000, count: 5 };
    const a = generateLoopCandidates({ ...args, rng: seeded(42) });
    const b = generateLoopCandidates({ ...args, rng: seeded(42) });
    const c = generateLoopCandidates({ ...args, rng: seeded(43) });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it.each([3, 5, 8])('keeps the loop length near the target (count=%i)', (count) => {
    for (let seed = 1; seed <= 20; seed++) {
      const pts = generateLoopCandidates({
        origin,
        targetDistanceMeters: 4000,
        count,
        rng: seeded(seed),
      });
      const len = loopLength(pts);
      expect(len).toBeGreaterThan(4000 * 0.7);
      expect(len).toBeLessThan(4000 * 1.3);
    }
  });

  it('keeps every point within the loop diameter of the origin', () => {
    const pts = generateLoopCandidates({
      origin,
      targetDistanceMeters: 4000,
      count: 6,
      rng: seeded(7),
    });
    const diameter = 4000 / Math.PI;
    for (const p of pts) {
      expect(haversineMeters(origin, p)).toBeLessThan(diameter * 1.3);
      expect(haversineMeters(origin, p)).toBeGreaterThan(0);
    }
  });

  it('rejects invalid input', () => {
    const rng = seeded(1);
    expect(() =>
      generateLoopCandidates({ origin, targetDistanceMeters: 3000, count: 0, rng }),
    ).toThrow();
    expect(() =>
      generateLoopCandidates({ origin, targetDistanceMeters: 0, count: 4, rng }),
    ).toThrow();
  });
});
