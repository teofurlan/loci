export const LOADING_SEGMENTS = 8;
export const SEGMENT_MS = 110;

/** How many bar segments are lit after `elapsedMs`: it fills, then loops. Reduced motion shows it full and still. */
export function filledSegments(elapsedMs: number, reducedMotion = false): number {
  if (reducedMotion) return LOADING_SEGMENTS;
  const step = Math.floor(Math.max(0, elapsedMs) / SEGMENT_MS);
  return (step % LOADING_SEGMENTS) + 1;
}
