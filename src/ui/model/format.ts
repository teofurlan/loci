import type { CompassPoint } from '../../domain/geo';
import type { Hint } from '../../domain/session';

const pad = (n: number): string => String(n).padStart(2, '0');

/** Elapsed time as m:ss, or h:mm:ss past one hour. */
export function formatElapsed(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

const COMPASS_WORDS: Record<CompassPoint, string> = {
  N: 'North',
  NE: 'North-east',
  E: 'East',
  SE: 'South-east',
  S: 'South',
  SW: 'South-west',
  W: 'West',
  NW: 'North-west',
};

export const compassWord = (point: CompassPoint): string => COMPASS_WORDS[point];

/** Distance rounded the way you would say it out loud. */
export function spokenDistance(meters: number): string {
  if (meters >= 1000) return `${(Math.round(meters / 100) / 10).toFixed(1)} kilometers`;
  return `${Math.max(10, Math.round(meters / 10) * 10)} meters`;
}

/** The direction half of a hint, for speech and for the screen. */
export const hintSentence = (hint: Hint): string => `${compassWord(hint.compass)}, ${spokenDistance(hint.distanceMeters)}.`;
