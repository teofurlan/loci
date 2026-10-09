import { offsetMeters } from '../../domain/geo';
import type { Landmark, LatLng } from '../../domain/types';
import type { RoutePlan } from '../../application/plan-route';
import { applyFixes, type RawLocation } from './apply-fixes';
import { createCourseStore } from './course-store';

const start: LatLng = { lat: 40, lng: -3 };
const lm = (id: string, north: number): Landmark => ({
  id,
  name: id,
  kind: 'park',
  position: offsetMeters(start, north, 0),
});
const plan: RoutePlan = {
  checkpoints: [lm('a', 300), lm('b', 600), lm('c', 900)],
  story: {
    title: 'T',
    fragments: [
      { landmarkId: 'a', text: 'one' },
      { landmarkId: 'b', text: 'two' },
      { landmarkId: 'c', text: 'three' },
    ],
  },
  distanceMeters: 2000,
  intent: {
    mode: 'walk',
    targetDistanceMeters: 2000,
    checkpointCount: 3,
    preferences: { preferGreen: false, preferRecognizable: false },
    notes: '',
  },
};
const config = { hitRadiusMeters: 25, maxAccuracyMeters: 30 };

const at = (checkpoint: number, timestamp: number, accuracy: number | null = 5): RawLocation => {
  const p = plan.checkpoints[checkpoint].position;
  return { coords: { latitude: p.lat, longitude: p.lng, accuracy }, timestamp };
};

const running = () => {
  const store = createCourseStore(config);
  store.setPlan(plan, start);
  store.beginRun(0);
  return store;
};

describe('applyFixes', () => {
  it('returns every control newly hit across a batch, in order', () => {
    const store = running();
    expect(applyFixes(store, [at(0, 1), at(1, 2)])).toEqual([0, 1]);
    const state = store.get();
    expect(state.phase === 'run' && state.session.run.visits.length).toBe(2);
  });

  it('reports a control only once when later fixes repeat it', () => {
    expect(applyFixes(running(), [at(0, 1), at(0, 2)])).toEqual([0]);
  });

  it('applies fixes oldest first even when the batch arrives out of order', () => {
    const store = running();
    applyFixes(store, [at(1, 20), at(0, 10)]);
    const state = store.get();
    expect(state.phase === 'run' && state.session.run.visits.map((v) => v.checkpointIndex)).toEqual([0, 1]);
  });

  it('ignores fixes less accurate than the run allows', () => {
    expect(applyFixes(running(), [at(0, 1, 80)])).toEqual([]);
  });

  it('treats a missing accuracy as unusable', () => {
    expect(applyFixes(running(), [at(0, 1, null)])).toEqual([]);
  });

  it('ignores fixes after the run has ended', () => {
    const store = running();
    store.giveUp(5);
    expect(applyFixes(store, [at(0, 6)])).toEqual([]);
    expect(store.get().phase).toBe('results');
  });

  it('stops at completion and ignores the rest of the batch', () => {
    const store = running();
    const hits = applyFixes(store, [at(0, 1), at(1, 2), at(2, 3), at(0, 4)]);
    expect(hits).toEqual([0, 1, 2]);
    expect(store.get().phase).toBe('results');
  });

  it('does nothing for an empty batch', () => {
    expect(applyFixes(running(), [])).toEqual([]);
  });
});
