import { SOURCE_PER_CELL } from './mark';
import { RING_CENTRE } from './mark-trace';

export type StarCell = {
  x: number;
  y: number;
  /** The cell is part of the light core at the star's heart (bright frame only). */
  light: boolean;
};

/** Radius of the bright star in grid cells: 15 source cells, so its points reach a little past the ring it replaces. */
export const STAR_RADIUS = 15 / SOURCE_PER_CELL;
/** The dim twinkle frame is the same star at this fraction of the radius, with no light core. */
const DIM_RADIUS = 0.62;
/** The astroid's exponent: below 1 the sides curve in, leaving four thin points. */
const CURVE = 0.62;
/** The light core is the cells within this fraction of the radius (a diamond), on the bright frame. */
const CORE = 0.18;

/**
 * The four-point sparkle of the opening, centred on the right ring, as grid cells: a cell is in when its centre
 * satisfies (dx / R)^0.62 + (dy / R)^0.62 <= 1 round the star centre, with a diamond of light core. \`small\` is the dim
 * twinkle frame (62% of the radius, no core).
 */
export function sparkleCells(small: boolean): readonly StarCell[] {
  const R = small ? STAR_RADIUS * DIM_RADIUS : STAR_RADIUS;
  const span = Math.ceil(R) + 1;
  const originX = Math.round(RING_CENTRE.x);
  const originY = Math.round(RING_CENTRE.y);
  const cells: StarCell[] = [];
  for (let y = -span; y <= span; y += 1) {
    for (let x = -span; x <= span; x += 1) {
      const dx = Math.abs(originX + x + 0.5 - RING_CENTRE.x);
      const dy = Math.abs(originY + y + 0.5 - RING_CENTRE.y);
      if ((dx / R) ** CURVE + (dy / R) ** CURVE > 1) continue;
      cells.push({ x: originX + x, y: originY + y, light: !small && dx + dy <= R * CORE });
    }
  }
  return cells;
}

export type StarSprite = {
  /** Grid cell of the sprite's top left corner. */
  x: number;
  y: number;
  /** Rows of \`0\` (body), \`3\` (light core) and \`.\`: the sprite palette indices, so the sprite path builder draws it. */
  rows: string[];
};

/** The star as a small sprite, cropped to its cells. */
export function starSprite(small: boolean): StarSprite {
  const cells = sparkleCells(small);
  const x0 = Math.min(...cells.map((c) => c.x));
  const y0 = Math.min(...cells.map((c) => c.y));
  const x1 = Math.max(...cells.map((c) => c.x));
  const y1 = Math.max(...cells.map((c) => c.y));
  const grid = Array.from({ length: y1 - y0 + 1 }, () => Array.from({ length: x1 - x0 + 1 }, () => '.'));
  for (const c of cells) grid[c.y - y0][c.x - x0] = c.light ? '3' : '0';
  return { x: x0, y: y0, rows: grid.map((row) => row.join('')) };
}
