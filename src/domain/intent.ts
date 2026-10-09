import type { RoutePreferences } from './types';

export type RouteMode = 'walk' | 'run';

export type RouteIntent = {
  mode: RouteMode;
  targetDistanceMeters: number;
  checkpointCount: number;
  preferences: RoutePreferences;
  storyStyle?: string;
  /** Things the model understood from the request that the app does not act on. */
  notes: string;
};

export const MIN_DISTANCE_METERS = 1000;
export const MAX_DISTANCE_METERS = 10_000;
export const MIN_CHECKPOINTS = 4;
export const MAX_CHECKPOINTS = 8;
export const DEFAULT_CHECKPOINTS = 5;
export const METERS_PER_CHECKPOINT = 700;

const DEFAULT_DISTANCE_METERS: Record<RouteMode, number> = { walk: 3000, run: 5000 };
const PACE_KMH: Record<RouteMode, number> = { walk: 5, run: 9 };
const LEVEL_FACTOR = { beginner: 0.8, intermediate: 1, advanced: 1.1 } as const;
const MAX_TEXT = 300;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : '';
}

/**
 * Turns untrusted model output into a valid RouteIntent. Never throws:
 * anything missing or malformed falls back to a safe default.
 */
export function normalizeIntent(raw: unknown): RouteIntent {
  const obj: Record<string, unknown> =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const mode: RouteMode = obj.mode === 'run' ? 'run' : 'walk';
  const level = typeof obj.level === 'string' && obj.level in LEVEL_FACTOR
    ? (obj.level as keyof typeof LEVEL_FACTOR)
    : 'intermediate';

  const distanceKm = positiveNumber(obj.distanceKm);
  const durationMinutes = positiveNumber(obj.durationMinutes);
  let requestedMeters: number | undefined;
  if (distanceKm !== undefined) requestedMeters = distanceKm * 1000;
  else if (durationMinutes !== undefined) {
    requestedMeters = (durationMinutes / 60) * PACE_KMH[mode] * LEVEL_FACTOR[level] * 1000;
  }
  const targetDistanceMeters = Math.round(
    clamp(requestedMeters ?? DEFAULT_DISTANCE_METERS[mode], MIN_DISTANCE_METERS, MAX_DISTANCE_METERS),
  );

  const explicitCount = positiveNumber(obj.checkpointCount);
  const rawCount =
    explicitCount ??
    (requestedMeters === undefined ? DEFAULT_CHECKPOINTS : targetDistanceMeters / METERS_PER_CHECKPOINT);

  return {
    mode,
    targetDistanceMeters,
    checkpointCount: clamp(Math.round(rawCount), MIN_CHECKPOINTS, MAX_CHECKPOINTS),
    preferences: {
      preferGreen: obj.preferGreen === true,
      preferRecognizable: obj.preferRecognizable === true,
    },
    storyStyle: text(obj.storyStyle) || undefined,
    notes: text(obj.notes),
  };
}
