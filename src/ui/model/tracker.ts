import type { CourseState } from './course-store';

export type TrackerDeps = {
  isStarted(): Promise<boolean>;
  start(): Promise<void>;
  stop(): Promise<void>;
};

/**
 * Owns the lifetime of the background location task. Calls are serialized so a stop issued
 * while a start is in flight always wins, and the task never outlives the run.
 */
export function createTracker(deps: TrackerDeps) {
  let queue: Promise<void> = Promise.resolve();
  const enqueue = (job: () => Promise<void>) => {
    queue = queue.then(job, job);
    return queue;
  };

  const stop = () =>
    enqueue(async () => {
      try {
        if (await deps.isStarted()) await deps.stop();
      } catch {
        // Stopping is best effort: there is nothing useful a caller could do about a failure.
      }
    });

  return {
    start: () =>
      enqueue(async () => {
        if (!(await deps.isStarted())) await deps.start();
      }),
    stop,
    /** Anything but a run in progress must have no task: covers completion, give up and a restart. */
    reconcile: (phase: CourseState['phase']) => (phase === 'run' ? Promise.resolve() : stop()),
  };
}

export type Tracker = ReturnType<typeof createTracker>;
