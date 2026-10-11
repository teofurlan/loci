/**
 * Stepped ("rounded pixel") corners. A profile lists, row by row from the edge, how many rule-widths each corner
 * row is inset. The outer shape of a rounded box uses [2, 1] and its inner fill [1], with the rule width as N.
 */
export const ROUND_OUTER: readonly number[] = [2, 1];
export const ROUND_INNER: readonly number[] = [1];

export type CornerRect = { x: number; y: number; width: number; height: number };

/**
 * The blocks that paint one corner (the top-left; mirror it for the others): a block per profile row, `n` tall and
 * as wide as the row's inset. Rows with no inset need nothing.
 */
export function cornerRects(profile: readonly number[], n: number): CornerRect[] {
  const rects: CornerRect[] = [];
  profile.forEach((inset, row) => {
    if (inset > 0) rects.push({ x: 0, y: row * n, width: inset * n, height: n });
  });
  return rects;
}
