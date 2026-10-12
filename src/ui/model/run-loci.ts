import type { LociState } from './loci';

/** How long Loci dances after a control is found, ms (a few beats of the dance). */
export const CELEBRATE_MS = 3000;

/**
 * Where a hint is: `requesting` from the tap until the hint exists (waiting for a GPS fix, computing),
 * `saying` while the clue is spoken or typed, `none` and `said` otherwise.
 */
export type HintPhase = 'none' | 'requesting' | 'saying' | 'said';

export type RunLociInput = {
  hint: HintPhase;
  /** The give-up confirmation is on screen. */
  confirming: boolean;
  /** When the last control was punched (ms), or null before the first. */
  lastPunchAt: number | null;
  now: number;
};

/** Loci's state on the run screen. The give-up confirmation wins, then a fresh find, then the hint. */
export function runLociState({ hint, confirming, lastPunchAt, now }: RunLociInput): LociState {
  if (confirming) return 'waiting';
  if (lastPunchAt !== null && now - lastPunchAt < CELEBRATE_MS) return 'celebrate';
  if (hint === 'requesting') return 'listening';
  if (hint === 'saying') return 'hint';
  return 'waiting';
}
