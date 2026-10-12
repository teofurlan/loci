export const FADE_STEP_MS = 140;
const STEPS = 4;

/** A black overlay over the map: how opaque it is for `ms`. */
export type FadeStep = { opacity: number; ms: number };

/**
 * The signature: on "Hide map & start" the map steps down to black in four hard cuts (25, 50, 75 and 100% black),
 * one per step. Reduced motion is a single instant cut to black.
 */
export function mapFadeSequence(reducedMotion: boolean): readonly FadeStep[] {
  if (reducedMotion) return [{ opacity: 1, ms: 0 }];
  return Array.from({ length: STEPS }, (_, i) => ({ opacity: (i + 1) / STEPS, ms: FADE_STEP_MS }));
}
