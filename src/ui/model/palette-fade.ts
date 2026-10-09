import { PALETTE } from '../theme/palette';

export const FADE_STEP_MS = 140;

export type FadeStep = { color: string; ms: number };

/**
 * The signature: the screen steps through the four greens to ink, one hard cut per shade.
 * Reduced motion is a single instant cut to ink.
 */
export function fadeSequence(reducedMotion: boolean): readonly FadeStep[] {
  if (reducedMotion) return [{ color: PALETTE.ink, ms: 0 }];
  return [PALETTE.lit, PALETTE.ground, PALETTE.shade, PALETTE.ink].map((color) => ({ color, ms: FADE_STEP_MS }));
}
