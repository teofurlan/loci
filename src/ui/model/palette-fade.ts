import { mixHex } from '../theme/palette';

export const FADE_STEP_MS = 140;
const STEPS = 4;

export type FadeStep = { color: string; ms: number };

/**
 * The signature: the screen steps through four tones from the ground to the run color, one hard cut per tone.
 * Reduced motion is a single instant cut to the run color.
 */
export function fadeSequence(reducedMotion: boolean, from: string, to: string): readonly FadeStep[] {
  if (reducedMotion) return [{ color: to, ms: 0 }];
  return Array.from({ length: STEPS }, (_, i) => ({ color: mixHex(from, to, (i + 1) / STEPS), ms: FADE_STEP_MS }));
}
