import { offsetMeters } from './geo';
import { giveUp, recordSessionFix, requestHint, scoreSession, startSession } from './session';
import type { Story } from './story';
import type { Fix, Landmark, LatLng } from './types';

const origin: LatLng = { lat: 40, lng: -3 };
const config = { hitRadiusMeters: 25, maxAccuracyMeters: 30 };

const landmark = (id: string, position: LatLng): Landmark => ({ id, name: `Name ${id}`, kind: 'park', position });
const near = landmark('node/1', offsetMeters(origin, 500, 0));
const mid = landmark('node/2', offsetMeters(origin, 0, 900));
const far = landmark('node/3', offsetMeters(origin, -1500, 0));
const story: Story = {
  title: 't',
  fragments: [
    { landmarkId: 'node/1', text: 'first' },
    { landmarkId: 'node/2', text: 'second' },
    { landmarkId: 'node/3', text: 'third' },
  ],
};
const fix = (position: LatLng, timestamp = 1): Fix => ({ position, accuracyMeters: 5, timestamp });
const fresh = () => startSession([near, mid, far], story, config);

describe('run session', () => {
  it('starts active with nothing scored', () => {
    expect(scoreSession(fresh())).toEqual({ points: 0, visited: 0, total: 3, ratio: 0, hintsUsed: 0 });
    expect(fresh().status).toBe('active');
  });

  it('hints the nearest unvisited checkpoint with fragment, bearing, compass and distance', () => {
    const { hint } = requestHint(fresh(), origin);
    expect(hint?.checkpointIndex).toBe(0);
    expect(hint?.fragment).toBe('first');
    expect(hint?.bearingDegrees).toBeCloseTo(0, 0);
    expect(hint?.compass).toBe('N');
    expect(hint?.distanceMeters).toBeGreaterThan(490);
    expect(hint?.distanceMeters).toBeLessThan(510);
  });

  it('skips visited checkpoints when hinting', () => {
    const hit = recordSessionFix(fresh(), fix(near.position)).state;
    expect(requestHint(hit, origin).hint?.checkpointIndex).toBe(1);
  });

  it('scores 1 for an unhinted hit and 0.5 for a hinted one', () => {
    let s = fresh();
    s = requestHint(s, origin).state; // hints checkpoint 0
    s = recordSessionFix(s, fix(near.position)).state;
    s = recordSessionFix(s, fix(mid.position)).state;
    expect(scoreSession(s)).toEqual({ points: 1.5, visited: 2, total: 3, ratio: 2 / 3, hintsUsed: 1 });
  });

  it('does not double count repeated hints on the same checkpoint', () => {
    let s = fresh();
    s = requestHint(s, origin).state;
    s = requestHint(s, origin).state;
    expect(scoreSession(s).hintsUsed).toBe(1);
  });

  it('giving up ends the run and keeps the current score', () => {
    const hit = recordSessionFix(fresh(), fix(near.position)).state;
    const ended = giveUp(hit);
    expect(ended.status).toBe('gave-up');
    expect(scoreSession(ended)).toMatchObject({ points: 1, visited: 1, total: 3 });
  });

  it('ignores fixes and hints after giving up', () => {
    const ended = giveUp(fresh());
    const result = recordSessionFix(ended, fix(near.position));
    expect(result.state).toBe(ended);
    expect(result.newlyHit).toEqual([]);
    expect(requestHint(ended, origin)).toEqual({ state: ended, hint: undefined });
  });

  it('completes when every checkpoint is visited and then ignores fixes', () => {
    let s = fresh();
    for (const l of [near, mid, far]) s = recordSessionFix(s, fix(l.position)).state;
    expect(s.status).toBe('completed');
    expect(scoreSession(s)).toMatchObject({ points: 3, visited: 3, total: 3, ratio: 1 });
    expect(recordSessionFix(s, fix(near.position)).state).toBe(s);
    expect(requestHint(s, origin).hint).toBeUndefined();
  });

  it('reports newly hit indexes', () => {
    expect(recordSessionFix(fresh(), fix(mid.position)).newlyHit).toEqual([1]);
  });

  it('falls back to the landmark name when the story lacks a fragment', () => {
    const s = startSession([near], { title: 't', fragments: [] }, config);
    expect(requestHint(s, origin).hint?.fragment).toBe('Name node/1');
  });
});
