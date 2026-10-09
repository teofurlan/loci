import { haversineMeters } from './geo';
import type { Landmark, LandmarkKind, LatLng, Rng, RoutePreferences } from './types';

export type SelectParams = {
  candidates: readonly LatLng[];
  landmarks: readonly Landmark[];
  preferences: RoutePreferences;
  visitedIds: ReadonlySet<string>;
  /** Share of checkpoints that should be landmarks the user has already visited. */
  familiarRatio: number;
  snapRadiusMeters: number;
  rng: Rng;
};

export type SelectResult = {
  checkpoints: Landmark[];
  /** Candidates for which no landmark was available; the caller decides on a fallback. */
  unmatched: number;
};

const GREEN_KINDS: ReadonlySet<LandmarkKind> = new Set(['park', 'water']);
const RECOGNIZABLE_KINDS: ReadonlySet<LandmarkKind> = new Set([
  'monument',
  'artwork',
  'worship',
  'fountain',
  'square',
]);

const PREFERENCE_BOOST = 0.5;
/** Tie-break jitter, about 0.2 m of closeness at a 200 m snap radius. */
const TIE_JITTER = 1e-3;

function score(
  landmark: Landmark,
  distance: number,
  snapRadiusMeters: number,
  preferences: RoutePreferences,
  rng: Rng,
): number {
  let value = 1 - distance / snapRadiusMeters;
  if (preferences.preferGreen && GREEN_KINDS.has(landmark.kind)) value += PREFERENCE_BOOST;
  if (preferences.preferRecognizable && RECOGNIZABLE_KINDS.has(landmark.kind)) {
    value += PREFERENCE_BOOST;
  }
  return value + rng() * TIE_JITTER;
}

/**
 * Snaps each loop candidate to a real landmark within `snapRadiusMeters`.
 * Candidates are handled in order, never reusing a landmark. Familiar and new
 * landmarks are balanced toward `round(count * familiarRatio)`; when one group
 * runs out the other fills in.
 */
export function selectCheckpoints({
  candidates,
  landmarks,
  preferences,
  visitedIds,
  familiarRatio,
  snapRadiusMeters,
  rng,
}: SelectParams): SelectResult {
  const familiarTarget = Math.round(candidates.length * Math.min(1, Math.max(0, familiarRatio)));
  let familiarLeft = familiarTarget;
  let newLeft = candidates.length - familiarTarget;

  const used = new Set<string>();
  const checkpoints: Landmark[] = [];
  let unmatched = 0;

  for (const candidate of candidates) {
    const nearby = landmarks
      .filter((l) => !used.has(l.id))
      .map((landmark) => ({ landmark, distance: haversineMeters(candidate, landmark.position) }))
      .filter((c) => c.distance <= snapRadiusMeters);

    const isFamiliar = (l: Landmark) => visitedIds.has(l.id);
    const wanted = nearby.filter(({ landmark }) =>
      isFamiliar(landmark) ? familiarLeft > 0 : newLeft > 0,
    );
    const pool = wanted.length > 0 ? wanted : nearby;

    let best: Landmark | undefined;
    let bestScore = -Infinity;
    for (const { landmark, distance } of pool) {
      const s = score(landmark, distance, snapRadiusMeters, preferences, rng);
      if (s > bestScore) {
        best = landmark;
        bestScore = s;
      }
    }

    if (!best) {
      unmatched++;
      continue;
    }
    used.add(best.id);
    checkpoints.push(best);
    if (isFamiliar(best)) familiarLeft--;
    else newLeft--;
  }

  return { checkpoints, unmatched };
}
