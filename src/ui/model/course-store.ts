import type { RoutePlan } from '../../application/plan-route';
import {
  giveUp as giveUpSession,
  recordSessionFix,
  requestHint,
  startSession,
  type Hint,
  type RunSession,
} from '../../domain/session';
import type { Fix, LatLng, RunConfig } from '../../domain/types';

export const DEFAULT_RUN_CONFIG: RunConfig = { hitRadiusMeters: 25, maxAccuracyMeters: 30 };

export type CourseState =
  | { phase: 'empty' }
  | { phase: 'memorize'; plan: RoutePlan; start: LatLng; session: RunSession }
  | { phase: 'run'; plan: RoutePlan; start: LatLng; session: RunSession; startedAt: number }
  | { phase: 'results'; plan: RoutePlan; start: LatLng; session: RunSession; elapsedMs: number };

type Listener = () => void;

/**
 * Holds the current course between screens: plan, start point and the domain session.
 * All game rules stay in the domain; this only sequences the phases.
 */
export function createCourseStore(config: RunConfig = DEFAULT_RUN_CONFIG) {
  let state: CourseState = { phase: 'empty' };
  const listeners = new Set<Listener>();

  const set = (next: CourseState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  return {
    get: (): CourseState => state,

    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setPlan(plan: RoutePlan, start: LatLng) {
      set({ phase: 'memorize', plan, start, session: startSession(plan.checkpoints, plan.story, config) });
    },

    beginRun(now: number) {
      if (state.phase !== 'memorize') return;
      set({ ...state, phase: 'run', startedAt: now });
    },

    /** Returns the indexes newly punched by this fix. Finishing the last control moves to results. */
    recordFix(fix: Fix): readonly number[] {
      if (state.phase !== 'run') return [];
      const { state: session, newlyHit } = recordSessionFix(state.session, fix);
      if (newlyHit.length === 0) return newlyHit;
      if (session.status === 'completed') {
        const { startedAt, ...rest } = state;
        set({ ...rest, phase: 'results', session, elapsedMs: Math.max(0, fix.timestamp - startedAt) });
      } else {
        set({ ...state, session });
      }
      return newlyHit;
    },

    hint(from: LatLng): Hint | undefined {
      if (state.phase !== 'run') return undefined;
      const { state: session, hint } = requestHint(state.session, from);
      if (hint) set({ ...state, session });
      return hint;
    },

    giveUp(now: number) {
      if (state.phase !== 'run') return;
      const { startedAt, ...rest } = state;
      set({ ...rest, phase: 'results', session: giveUpSession(state.session), elapsedMs: Math.max(0, now - startedAt) });
    },

    reset() {
      set({ phase: 'empty' });
    },
  };
}

export type CourseStore = ReturnType<typeof createCourseStore>;
