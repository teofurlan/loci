/** One cadence for every typed fragment, with or without speech: about 20 characters a second. */
export const MS_PER_CHAR = 50;

/** How many characters of a text of `length` are visible after `elapsedMs` of typing. */
export function revealedCount(elapsedMs: number, length: number): number {
  if (length <= 0 || elapsedMs <= 0) return 0;
  return Math.min(length, Math.floor(elapsedMs / MS_PER_CHAR));
}

/** The first `count` characters, counted in whole code points so emoji never split. */
export function typedText(text: string, count: number): string {
  if (count <= 0) return '';
  const points = Array.from(text);
  return count >= points.length ? text : points.slice(0, count).join('');
}

/** The next landmark in the dialogue, wrapping after the last. */
export function advanceIndex(index: number, total: number): number {
  return total <= 1 ? 0 : (index + 1) % total;
}
