import { MARK_ROWS } from './mark';
import { spriteRows } from './sprites';

/**
 * The centre line of the mark's stroke, from the left checkpoint ring to the right one, in 96 x 112 mark cells.
 * The stroke crosses itself where the loop closes, so a flood fill from the left end would take the shortcut
 * and finish somewhere in the loop; following this line keeps the order the way a pen would draw it. The line
 * reads the approved art (it is traced on it), and a test checks that the order it yields covers every ink cell.
 */
const WAYPOINTS: readonly (readonly [number, number])[] = (
  [
    [8.5, 48], // left checkpoint ring
    [12, 47],
    [16, 45.5],
    [20, 43],
    [21, 38],
    [20.5, 30],
    [21, 22],
    [23, 14],
    [27, 8],
    [30, 5.5], // top of the loop
    [32, 8],
    [33, 13],
    [33, 18],
    [32, 22],
    [31, 26],
    [29, 29],
    [27, 32],
    [25, 35],
    [23, 38], // the stroke crosses itself
    [22, 42],
    [22.5, 46],
    [25, 48],
    [30, 48.5],
    [33, 46],
    [35.5, 43],
    [38, 40.5], // right checkpoint ring
  ] as const
).map(([x, y]) => [x * 2 + 1, y * 2 + 1] as const);

export type TraceCell = { x: number; y: number; /** Distance along the stroke from its left end, in mark cells. */ d: number };

const SAMPLE_STEP = 0.5;

function samples(points: readonly (readonly [number, number])[]): { x: number; y: number; d: number }[] {
  const out: { x: number; y: number; d: number }[] = [];
  let travelled = 0;
  for (let i = 0; i + 1 < points.length; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const length = Math.hypot(x1 - x0, y1 - y0);
    const count = Math.ceil(length / SAMPLE_STEP);
    for (let s = 0; s < count; s += 1) {
      const t = s / count;
      out.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, d: travelled + length * t });
    }
    travelled += length;
  }
  const [lx, ly] = points[points.length - 1];
  out.push({ x: lx, y: ly, d: travelled });
  return out;
}

/**
 * Every ink cell with its distance along the stroke, drawn first to last. A cell takes the distance of the
 * nearest point of the centre line (the earliest one when the stroke crosses itself); ties go top to bottom,
 * left to right, so the order is deterministic.
 */
export function traceCells(rows: readonly string[], points = WAYPOINTS): readonly TraceCell[] {
  const line = samples(points);
  const cells: TraceCell[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== '0') continue;
      let best = line[0];
      let bestSq = Infinity;
      for (const point of line) {
        const sq = (point.x - (x + 0.5)) ** 2 + (point.y - (y + 0.5)) ** 2;
        if (sq < bestSq - 1e-9) {
          bestSq = sq;
          best = point;
        }
      }
      cells.push({ x, y, d: best.d });
    }
  });
  return cells.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
}

export const MARK_TRACE: readonly TraceCell[] = traceCells(MARK_ROWS);

/** The last cell drawn: the far side of the right checkpoint ring, where the place is reached. */
export const TRACE_END: TraceCell = MARK_TRACE[MARK_TRACE.length - 1];
/** Centre of the right checkpoint ring in mark cells, where the sparkle pops. */
export const RING_CENTRE = { x: WAYPOINTS[WAYPOINTS.length - 1][0], y: WAYPOINTS[WAYPOINTS.length - 1][1] } as const;

export const TRACE_MS = 1200;
export const SPARKLE_MS = 400;
export const TRACE_STEPS = 30;
/** The first frame already shows this much of the stroke (the left ring), so the native splash can match it. */
const LEAD_IN = 8;

const STROKE_LENGTH = MARK_TRACE[MARK_TRACE.length - 1].d;

export type TraceFrame = {
  /** Whole animation step, 0 to TRACE_STEPS. */
  step: number;
  /** How many cells of MARK_TRACE are drawn. */
  revealed: number;
  /** 0 none, 1 small gold plus, 2 the full gold sparkle. */
  sparkle: 0 | 1 | 2;
  done: boolean;
};

const revealedAt = (step: number): number => {
  const limit = LEAD_IN + (step / TRACE_STEPS) * (STROKE_LENGTH - LEAD_IN);
  let count = 0;
  while (count < MARK_TRACE.length && MARK_TRACE[count].d <= limit + 1e-9) count += 1;
  return count;
};
const REVEALED_BY_STEP: readonly number[] = Array.from({ length: TRACE_STEPS + 1 }, (_, s) => revealedAt(s));

/** The opening animation at `elapsedMs`: the path draws in pixel steps, then the sparkle pops. Reduced motion skips it. */
export function traceFrame(elapsedMs: number, reducedMotion = false): TraceFrame {
  if (reducedMotion) return { step: TRACE_STEPS, revealed: MARK_TRACE.length, sparkle: 0, done: true };
  const t = Math.max(0, elapsedMs);
  const step = Math.min(TRACE_STEPS, Math.floor((t / TRACE_MS) * TRACE_STEPS));
  const after = t - TRACE_MS;
  const sparkle = after < 0 ? 0 : after < SPARKLE_MS * 0.3 ? 1 : 2;
  return { step, revealed: REVEALED_BY_STEP[step], sparkle, done: t >= TRACE_MS + SPARKLE_MS };
}

/** The mark grid with only the first `count` traced cells drawn. */
export function revealedRows(count: number): string[] {
  const grid = MARK_ROWS.map((row) => Array.from(row, () => '.'));
  for (let i = 0; i < Math.min(count, MARK_TRACE.length); i += 1) grid[MARK_TRACE[i].y][MARK_TRACE[i].x] = '0';
  return grid.map((row) => row.join(''));
}

/** The found sparkle (`found-b` corner, 5 x 5: ink `0`, gold `3`) and its small first frame. */
export const SPARKLE_FULL: readonly string[] = spriteRows('found-b')
  .slice(0, 5)
  .map((row) => row.slice(0, 5));
export const SPARKLE_SMALL: readonly string[] = ['.....', '..3..', '.333.', '..3..', '.....'];
