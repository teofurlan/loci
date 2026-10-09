import { offsetMeters } from './geo';
import { recordFix, scoreRun, startRun } from './run';
import type { Fix, LatLng } from './types';

const a: LatLng = { lat: 40, lng: -3 };
const b = offsetMeters(a, 500, 0);
const c = offsetMeters(a, 0, 800);
const config = { hitRadiusMeters: 25, maxAccuracyMeters: 30 };

const fix = (position: LatLng, accuracyMeters = 10, timestamp = 1): Fix => ({
  position,
  accuracyMeters,
  timestamp,
});

describe('run tracking', () => {
  it('starts with nothing visited', () => {
    const s = startRun([a, b, c], config);
    expect(scoreRun(s)).toEqual({ visited: 0, total: 3, ratio: 0, order: [] });
  });

  it('marks a checkpoint visited when a fix is within the hit radius', () => {
    const s0 = startRun([a, b, c], config);
    const { state, newlyHit } = recordFix(s0, fix(offsetMeters(b, 10, 0)));
    expect(newlyHit).toEqual([1]);
    expect(scoreRun(state).visited).toBe(1);
  });

  it('does not hit when the fix is outside the radius', () => {
    const s0 = startRun([a, b, c], config);
    const { state, newlyHit } = recordFix(s0, fix(offsetMeters(b, 60, 0)));
    expect(newlyHit).toEqual([]);
    expect(scoreRun(state).visited).toBe(0);
  });

  it('ignores fixes with accuracy worse than the maximum', () => {
    const s0 = startRun([a, b, c], config);
    const { state, newlyHit } = recordFix(s0, fix(b, 31));
    expect(newlyHit).toEqual([]);
    expect(state).toBe(s0);
  });

  it('accepts a fix exactly at the max accuracy and exactly at the radius', () => {
    const s0 = startRun([a], config);
    const edge = offsetMeters(a, 24.9, 0);
    expect(recordFix(s0, fix(edge, 30)).newlyHit).toEqual([0]);
  });

  it('does not double count a checkpoint visited twice', () => {
    const s0 = startRun([a, b], config);
    const r1 = recordFix(s0, fix(a, 10, 1));
    const r2 = recordFix(r1.state, fix(a, 10, 2));
    expect(r2.newlyHit).toEqual([]);
    expect(scoreRun(r2.state).visited).toBe(1);
  });

  it('does not require order and records visit order', () => {
    let s = startRun([a, b, c], config);
    s = recordFix(s, fix(c, 10, 1)).state;
    s = recordFix(s, fix(a, 10, 2)).state;
    expect(scoreRun(s)).toEqual({ visited: 2, total: 3, ratio: 2 / 3, order: [2, 0] });
  });

  it('reports every checkpoint newly hit by a single fix', () => {
    const near = [a, offsetMeters(a, 5, 0)];
    const s0 = startRun(near, config);
    expect(recordFix(s0, fix(a)).newlyHit).toEqual([0, 1]);
  });

  it('does not mutate the previous state', () => {
    const s0 = startRun([a], config);
    recordFix(s0, fix(a));
    expect(scoreRun(s0).visited).toBe(0);
  });

  it('scores an empty route as ratio 0', () => {
    expect(scoreRun(startRun([], config))).toEqual({ visited: 0, total: 0, ratio: 0, order: [] });
  });
});
