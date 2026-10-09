import { offsetMeters } from '../../domain/geo';
import type { Landmark, LatLng } from '../../domain/types';
import type { RoutePlan } from '../../application/plan-route';
import { createCourseStore } from './course-store';

const start: LatLng = { lat: 40, lng: -3 };
const lm = (id: string, north: number): Landmark => ({
  id,
  name: id,
  kind: 'park',
  position: offsetMeters(start, north, 0),
});
const plan: RoutePlan = {
  checkpoints: [lm('node/1', 300), lm('node/2', 600), lm('node/3', 900)],
  story: {
    title: 'T',
    fragments: [
      { landmarkId: 'node/1', text: 'one' },
      { landmarkId: 'node/2', text: 'two' },
      { landmarkId: 'node/3', text: 'three' },
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

describe('course store', () => {
  it('starts empty', () => {
    expect(createCourseStore(config).get()).toEqual({ phase: 'empty' });
  });

  it('holds a planned course with its start and a ready session', () => {
    const store = createCourseStore(config);
    store.setPlan(plan, start);
    const state = store.get();
    expect(state.phase).toBe('memorize');
    if (state.phase !== 'memorize') return;
    expect(state.plan).toBe(plan);
    expect(state.start).toEqual(start);
    expect(state.session.fragments).toEqual(['one', 'two', 'three']);
  });

  it('moves to running with a start time', () => {
    const store = createCourseStore(config);
    store.setPlan(plan, start);
    store.beginRun(1000);
    const state = store.get();
    expect(state.phase).toBe('run');
    if (state.phase !== 'run') return;
    expect(state.startedAt).toBe(1000);
  });

  it('records fixes through the domain session and reports newly hit controls', () => {
    const store = createCourseStore(config);
    store.setPlan(plan, start);
    store.beginRun(0);
    const hit = store.recordFix({ position: plan.checkpoints[1].position, accuracyMeters: 5, timestamp: 5 });
    expect(hit).toEqual([1]);
    const state = store.get();
    expect(state.phase === 'run' && state.session.run.visits.length).toBe(1);
  });

  it('finishes automatically when the last control is hit', () => {
    const store = createCourseStore(config);
    store.setPlan(plan, start);
    store.beginRun(0);
    plan.checkpoints.forEach((c, i) =>
      store.recordFix({ position: c.position, accuracyMeters: 5, timestamp: i + 1 }),
    );
    const state = store.get();
    expect(state.phase).toBe('results');
    expect(state.phase === 'results' && state.session.status).toBe('completed');
  });

  it('hints, remembering the hinted control', () => {
    const store = createCourseStore(config);
    store.setPlan(plan, start);
    store.beginRun(0);
    const hint = store.hint(start);
    expect(hint?.checkpointIndex).toBe(0);
    const state = store.get();
    expect(state.phase === 'run' && state.session.hinted).toEqual([0]);
  });

  it('gives up into results with the given-up status and elapsed time', () => {
    const store = createCourseStore(config);
    store.setPlan(plan, start);
    store.beginRun(0);
    store.giveUp(9000);
    const state = store.get();
    expect(state.phase).toBe('results');
    expect(state.phase === 'results' && state.session.status).toBe('gave-up');
    expect(state.phase === 'results' && state.elapsedMs).toBe(9000);
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const store = createCourseStore(config);
    const listener = jest.fn();
    const off = store.subscribe(listener);
    store.setPlan(plan, start);
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    store.reset();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toEqual({ phase: 'empty' });
  });

  it('ignores run actions when no run is active', () => {
    const store = createCourseStore(config);
    expect(store.recordFix({ position: start, accuracyMeters: 1, timestamp: 1 })).toEqual([]);
    expect(store.hint(start)).toBeUndefined();
    store.giveUp(5);
    expect(store.get()).toEqual({ phase: 'empty' });
  });
});
