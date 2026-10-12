/**
 * The aura around Loci on the chat home: a static, ragged-edged glow of pixel rings, drawn as solid colours (no
 * alpha) blended over the screen ground. Pure and computed once. Reproduces the approved study
 * (`loci-aura-study`): R = 43 cells, asymmetry 0.08, rough edges 0.17, strength 0.65, 7 steps, fading outward.
 */
import { mixHex } from '../theme/palette';
import { LOCI_COLS, lociRows } from './loci';

/** The scene is this many cells square; Loci sits in the middle. */
export const AURA_SCENE = 120;
export const AURA_LEVELS = 7;

const VIEW_W = 240;
const BODY_CENTER = { x: 125, y: 143 } as const;
const RADIUS = 43;
const ASYMMETRY = 0.08;
const ROUGH = 0.17;
const STRENGTH = 0.65;
const Y_SQUASH = 0.92;

/** Where Loci's 64-wide grid sits in the scene, in cells. */
export const LOCI_OFFSET = {
  x: Math.round((AURA_SCENE - LOCI_COLS) / 2),
  y: Math.round((AURA_SCENE - lociRows()) / 2) + 2,
} as const;

/** Stable per-cell noise in [0, 1), so the ragged edge never shimmers. */
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

let cached: readonly (readonly number[])[] | null = null;

/**
 * The aura as a scene-sized grid of levels: 0 is empty, 1 is the innermost (brightest) step and `AURA_LEVELS` the
 * outermost. Computed once; every call returns the same grid.
 */
export function auraGrid(): readonly (readonly number[])[] {
  if (cached) return cached;
  const scale = LOCI_COLS / VIEW_W;
  const cx = LOCI_OFFSET.x + BODY_CENTER.x * scale;
  const cy = LOCI_OFFSET.y + BODY_CENTER.y * scale;
  const grid: number[][] = [];
  for (let y = 0; y < AURA_SCENE; y += 1) {
    const row: number[] = new Array<number>(AURA_SCENE).fill(0);
    for (let x = 0; x < AURA_SCENE; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = (y + 0.5 - cy) * Y_SQUASH;
      const th = Math.atan2(dy, dx);
      // A few low harmonics make the outline lopsided on purpose.
      const r =
        RADIUS *
        (1 + ASYMMETRY * (0.9 * Math.sin(2 * th + 0.7) + 0.55 * Math.sin(3 * th + 2.1) + 0.35 * Math.sin(5 * th + 0.3)));
      const t = Math.hypot(dx, dy) / r + (hash(x, y) - 0.5) * ROUGH;
      if (t >= 1) continue;
      row[x] = Math.max(0, Math.min(AURA_LEVELS - 1, Math.floor(t * AURA_LEVELS))) + 1;
    }
    grid.push(row);
  }
  cached = grid;
  return grid;
}

/** One solid colour per level (index 0 is level 1), the aura colour fading outward over the ground. */
export function auraColors(ground: string, aura: string): string[] {
  return Array.from({ length: AURA_LEVELS }, (_, level) =>
    mixHex(ground, aura, Math.min(1, (1 - level / AURA_LEVELS) * STRENGTH)),
  );
}

let cachedPaths: Record<number, string> | null = null;

/** Run-length rect path data per level (key = level, 1-based), in scene cells. Computed once. */
export function auraPaths(): Record<number, string> {
  if (cachedPaths) return cachedPaths;
  const out: Record<number, string> = {};
  auraGrid().forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const value = row[x];
      if (value === 0) {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === value) end += 1;
      out[value] = `${out[value] ?? ''}M${x} ${y}h${end - x}v1h-${end - x}z`;
      x = end;
    }
  });
  cachedPaths = out;
  return out;
}
