import { bearingDegrees, compassLabel, haversineMeters, type CompassPoint } from './geo';
import { recordFix, startRun } from './run';
import type { Story } from './story';
import type { Fix, Landmark, LatLng, RunConfig, RunState } from './types';

export type SessionStatus = 'active' | 'completed' | 'gave-up';

export type RunSession = {
  run: RunState;
  landmarks: readonly Landmark[];
  /** Story text per checkpoint index, aligned with `landmarks`. */
  fragments: readonly string[];
  /** Checkpoint indexes the user asked a hint for. */
  hinted: readonly number[];
  status: SessionStatus;
};

export type Hint = {
  checkpointIndex: number;
  fragment: string;
  bearingDegrees: number;
  compass: CompassPoint;
  distanceMeters: number;
};

export type SessionScore = {
  /** 1 per checkpoint reached unaided, 0.5 per checkpoint reached after a hint. */
  points: number;
  visited: number;
  total: number;
  ratio: number;
  hintsUsed: number;
};

export const HINT_POINT_VALUE = 0.5;

export function startSession(landmarks: readonly Landmark[], story: Story, config: RunConfig): RunSession {
  const byId = new Map(story.fragments.map((f) => [f.landmarkId, f.text]));
  return {
    run: startRun(landmarks.map((l) => l.position), config),
    landmarks,
    fragments: landmarks.map((l) => byId.get(l.id) ?? l.name),
    hinted: [],
    status: 'active',
  };
}

/** Feeds a GPS fix to an active session; ended sessions are immutable and ignore it. */
export function recordSessionFix(
  session: RunSession,
  fix: Fix,
): { state: RunSession; newlyHit: readonly number[] } {
  if (session.status !== 'active') return { state: session, newlyHit: [] };
  const { state: run, newlyHit } = recordFix(session.run, fix);
  if (newlyHit.length === 0) return { state: session, newlyHit };
  const completed = run.visits.length === run.checkpoints.length;
  return { state: { ...session, run, status: completed ? 'completed' : 'active' }, newlyHit };
}

/** Hints the nearest unvisited checkpoint and remembers that it was hinted. */
export function requestHint(
  session: RunSession,
  from: LatLng,
): { state: RunSession; hint: Hint | undefined } {
  if (session.status !== 'active') return { state: session, hint: undefined };
  const visited = new Set(session.run.visits.map((v) => v.checkpointIndex));

  let best = -1;
  let bestDistance = Infinity;
  session.run.checkpoints.forEach((checkpoint, index) => {
    if (visited.has(index)) return;
    const distance = haversineMeters(from, checkpoint);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  if (best === -1) return { state: session, hint: undefined };

  const bearing = bearingDegrees(from, session.run.checkpoints[best]);
  const hint: Hint = {
    checkpointIndex: best,
    fragment: session.fragments[best],
    bearingDegrees: bearing,
    compass: compassLabel(bearing),
    distanceMeters: bestDistance,
  };
  const hinted = session.hinted.includes(best) ? session.hinted : [...session.hinted, best];
  return { state: { ...session, hinted }, hint };
}

export function giveUp(session: RunSession): RunSession {
  return session.status === 'active' ? { ...session, status: 'gave-up' } : session;
}

export function scoreSession(session: RunSession): SessionScore {
  const hinted = new Set(session.hinted);
  const total = session.run.checkpoints.length;
  const visits = session.run.visits;
  const points = visits.reduce((sum, v) => sum + (hinted.has(v.checkpointIndex) ? HINT_POINT_VALUE : 1), 0);
  return {
    points,
    visited: visits.length,
    total,
    ratio: total === 0 ? 0 : visits.length / total,
    hintsUsed: session.hinted.length,
  };
}
