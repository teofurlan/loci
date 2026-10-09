import { createTracker } from './tracker';

const fake = () => {
  let started = false;
  const calls: string[] = [];
  return {
    calls,
    isStarted: () => started,
    deps: {
      isStarted: async () => started,
      start: async () => {
        await Promise.resolve();
        calls.push('start');
        started = true;
      },
      stop: async () => {
        await Promise.resolve();
        calls.push('stop');
        started = false;
      },
    },
  };
};

describe('tracker', () => {
  it('starts location updates once however often it is asked', async () => {
    const f = fake();
    const tracker = createTracker(f.deps);
    await Promise.all([tracker.start(), tracker.start()]);
    expect(f.calls).toEqual(['start']);
  });

  it('stops only what is running', async () => {
    const f = fake();
    const tracker = createTracker(f.deps);
    await tracker.stop();
    expect(f.calls).toEqual([]);
    await tracker.start();
    await tracker.stop();
    expect(f.calls).toEqual(['start', 'stop']);
  });

  it('honours a stop requested while a start is still in flight', async () => {
    const f = fake();
    const tracker = createTracker(f.deps);
    const starting = tracker.start();
    const stopping = tracker.stop();
    await Promise.all([starting, stopping]);
    expect(f.isStarted()).toBe(false);
  });

  it('reconcile stops tracking for every phase except run', async () => {
    const f = fake();
    const tracker = createTracker(f.deps);
    await tracker.start();
    await tracker.reconcile('run');
    expect(f.isStarted()).toBe(true);
    await tracker.reconcile('results');
    expect(f.isStarted()).toBe(false);
  });

  it('reconcile clears an orphaned task left by a previous process', async () => {
    const f = fake();
    await f.deps.start();
    const tracker = createTracker(f.deps);
    await tracker.reconcile('empty');
    expect(f.isStarted()).toBe(false);
  });

  it('swallows a failing stop so callers never throw', async () => {
    const tracker = createTracker({
      isStarted: async () => true,
      start: async () => {},
      stop: async () => {
        throw new Error('gone');
      },
    });
    await expect(tracker.stop()).resolves.toBeUndefined();
  });
});
