import { haversineMeters } from './geo';
import type { Fix, LatLng, RecordFixResult, RunConfig, RunScore, RunState } from './types';

export function startRun(checkpoints: readonly LatLng[], config: RunConfig): RunState {
  return { checkpoints, config, visits: [] };
}

export function recordFix(state: RunState, fix: Fix): RecordFixResult {
  const { hitRadiusMeters, maxAccuracyMeters } = state.config;
  if (fix.accuracyMeters > maxAccuracyMeters) return { state, newlyHit: [] };

  const visited = new Set(state.visits.map((v) => v.checkpointIndex));
  const newlyHit: number[] = [];
  state.checkpoints.forEach((checkpoint, index) => {
    if (visited.has(index)) return;
    if (haversineMeters(fix.position, checkpoint) <= hitRadiusMeters) newlyHit.push(index);
  });
  if (newlyHit.length === 0) return { state, newlyHit };

  const visits = [
    ...state.visits,
    ...newlyHit.map((checkpointIndex) => ({ checkpointIndex, timestamp: fix.timestamp })),
  ];
  return { state: { ...state, visits }, newlyHit };
}

export function scoreRun(state: RunState): RunScore {
  const total = state.checkpoints.length;
  const visited = state.visits.length;
  return {
    visited,
    total,
    ratio: total === 0 ? 0 : visited / total,
    order: state.visits.map((v) => v.checkpointIndex),
  };
}
