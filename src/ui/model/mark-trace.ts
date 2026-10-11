import { MARK_ROWS } from './mark';
import { FOUND_FRAME_MS, spriteRows } from './sprites';

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

export type TraceCell = {
  x: number;
  y: number;
  /**
   * When the pen draws the cell. Along the stroke: the distance from the stroke's start (the left ring's right wall), in
   * mark cells. For a cell of a checkpoint ring: the fraction (0 to 1] of the way round that ring.
   */
  d: number;
};

type Box = { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number };
const inBox = (box: Box, x: number, y: number) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;

/** The left checkpoint ring in mark cells (inclusive): the pen's starting point, drawn first. The stroke leaves its right wall. */
export const LEFT_RING_BOX = { x0: 11, y0: 89, x1: 25, y1: 102 } as const;
/**
 * The right checkpoint ring in mark cells (inclusive): ink on all four edges, hollow inside. The stroke runs into
 * it from the lower left; its end is below this box. The star replaces everything inside it.
 */
export const RING_BOX = { x0: 70, y0: 73, x1: 83, y1: 84 } as const;
/** Centre of the right checkpoint ring in mark cells, where the star sits. */
export const RING_CENTRE = { x: (RING_BOX.x0 + RING_BOX.x1 + 1) / 2, y: (RING_BOX.y0 + RING_BOX.y1 + 1) / 2 } as const;

/** Where the pen draws a ring: from `startDeg` (degrees counter-clockwise from east, on screen) once round, in `turn` direction. */
const LEFT_RING_ORDER = { box: LEFT_RING_BOX, startDeg: 0, turn: 'ccw' } as const;
/** The right ring is drawn once the stroke reaches it, from where the stroke arrives (its lower left), clockwise. */
const RIGHT_RING_ORDER = { box: RING_BOX, startDeg: 240, turn: 'cw' } as const;
type RingOrder = typeof LEFT_RING_ORDER | typeof RIGHT_RING_ORDER;

/** Fraction (0 to 1] of the way round the ring that the cell at (x, y) is, so the first cells drawn sit just after the start. */
function ringFraction(order: RingOrder, x: number, y: number): number {
  const { box, startDeg, turn } = order;
  const cx = (box.x0 + box.x1 + 1) / 2;
  const cy = (box.y0 + box.y1 + 1) / 2;
  const deg = (Math.atan2(cy - (y + 0.5), x + 0.5 - cx) * 180) / Math.PI;
  const swept = turn === 'ccw' ? deg - startDeg : startDeg - deg;
  const wrapped = (((swept % 360) + 360) % 360) / 360;
  return wrapped === 0 ? 1 : wrapped;
}

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

const LINE = samples(WAYPOINTS);
/** Length of the pen's path from the ring to the right ring, in mark cells. */
export const STROKE_LENGTH = LINE[LINE.length - 1].d;

/** Where the pen tip is when it has written `length` cells of the stroke, in mark cell coordinates. */
export function strokePoint(length: number): { x: number; y: number } {
  const target = Math.min(Math.max(length, 0), STROKE_LENGTH);
  let lo = 0;
  let hi = LINE.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (LINE[mid].d <= target) lo = mid;
    else hi = mid - 1;
  }
  const a = LINE[lo];
  const b = LINE[Math.min(lo + 1, LINE.length - 1)];
  const span = b.d - a.d;
  const t = span > 0 ? (target - a.d) / span : 0;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Every ink cell in the order the pen draws it: first the left checkpoint ring, round from its right wall, then the
 * stroke, then the right checkpoint ring once the stroke reaches it. A stroke cell takes the distance of the nearest
 * point of the centre line (the earliest one when the stroke crosses itself, ties top to bottom, left to right), but
 * it is only drawn once the stroke already touches it: a cell assigned to an early pass that sits beside a later
 * strand waits for that strand, so the drawn part is always one connected stroke ending at the pen tip, never a
 * fragment ahead of it. Deterministic.
 */
export function traceCells(rows: readonly string[], points = WAYPOINTS): readonly TraceCell[] {
  const line = points === WAYPOINTS ? LINE : samples(points);
  const leftRing: TraceCell[] = [];
  const rightRing: TraceCell[] = [];
  const stroke: TraceCell[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] !== '0') continue;
      if (inBox(LEFT_RING_BOX, x, y)) {
        leftRing.push({ x, y, d: ringFraction(LEFT_RING_ORDER, x, y) });
        continue;
      }
      if (inBox(RING_BOX, x, y)) {
        rightRing.push({ x, y, d: ringFraction(RIGHT_RING_ORDER, x, y) });
        continue;
      }
      let best = line[0];
      let bestSq = Infinity;
      for (const point of line) {
        const sq = (point.x - (x + 0.5)) ** 2 + (point.y - (y + 0.5)) ** 2;
        if (sq < bestSq - 1e-9) {
          bestSq = sq;
          best = point;
        }
      }
      stroke.push({ x, y, d: best.d });
    }
  });
  const byOrder = (a: TraceCell, b: TraceCell) => a.d - b.d || a.y - b.y || a.x - b.x;
  leftRing.sort(byOrder);
  rightRing.sort(byOrder);
  stroke.sort(byOrder);

  const drawn = new Set<string>(leftRing.map((c) => `${c.x},${c.y}`));
  const waiting = new Map<string, TraceCell>();
  const out: TraceCell[] = [...leftRing];
  const touches = (c: TraceCell) => {
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (drawn.has(`${c.x + dx},${c.y + dy}`)) return true;
    return false;
  };
  const draw = (c: TraceCell, d: number) => {
    out.push({ x: c.x, y: c.y, d });
    drawn.add(`${c.x},${c.y}`);
    // whatever was waiting beside it joins the stroke now
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const next = waiting.get(`${c.x + dx},${c.y + dy}`);
        if (next) {
          waiting.delete(`${next.x},${next.y}`);
          draw(next, d);
        }
      }
    }
  };
  for (const cell of stroke) {
    if (touches(cell)) draw(cell, cell.d);
    else waiting.set(`${cell.x},${cell.y}`, cell);
  }
  // a cell the stroke never reaches (none in the approved art) still gets drawn, last
  for (const cell of waiting.values()) out.push({ ...cell, d: STROKE_LENGTH });
  return [...out, ...rightRing];
}

export const MARK_TRACE: readonly TraceCell[] = traceCells(MARK_ROWS);
/** How many cells of MARK_TRACE belong to the left ring (they come first). */
export const LEFT_RING_COUNT = MARK_TRACE.filter((c) => inBox(LEFT_RING_BOX, c.x, c.y)).length;
/** Index in MARK_TRACE of the right ring's first cell: the stroke is the cells between the two rings. */
export const RIGHT_RING_START = MARK_TRACE.length - MARK_TRACE.filter((c) => inBox(RING_BOX, c.x, c.y)).length;

/** The last cell drawn: the far side of the right checkpoint ring, where the place is reached. */
export const TRACE_END: TraceCell = MARK_TRACE[MARK_TRACE.length - 1];

/**
 * The left ring is drawn first, quickly, as the pen's starting point; the stroke then grows from it at an even speed; the
 * right ring is drawn as the pen arrives, just before the star replaces it.
 */
export const RING_MS = 140;
export const STROKE_MS = 1760;
export const END_RING_MS = 100;
export const TRACE_MS = RING_MS + STROKE_MS + END_RING_MS;
/** Pen speed along the stroke, in mark cells per millisecond (about 2 cells in a 60 Hz frame). */
export const PEN_CELLS_PER_MS = STROKE_LENGTH / STROKE_MS;

/** The mark's colour while it is being written (Harbor Haze), and the finale's two golds. */
export const TRACE_COLOUR = '#94B0C2';
/** Gold of the found star (the palette's found-b plus) and of the finished logo. */
export const GOLD = '#FFCD75';
/** The dim half of the twinkle: gold at about half strength on ink (3.8:1 against `#1A1C2C`). */
export const DIM_GOLD = '#8D7451';

/**
 * After the trace: the star replaces the ring, the logo turns gold and the two twinkle together, in phase. Each frame
 * lasts one found-flash frame (FOUND_FRAME_MS): bright is the full star over the gold logo, dim is the small star over a
 * dimmer logo; the star is always exactly the logo's colour. It starts and ends bright.
 */
const FINALE: readonly { star: 'full' | 'small' }[] = [
  { star: 'full' },
  { star: 'small' },
  { star: 'full' },
  { star: 'small' },
  { star: 'full' },
];
export const FINALE_MS = FINALE.length * FOUND_FRAME_MS;

export type TraceFrame = {
  /** How many cells of MARK_TRACE are drawn. */
  revealed: number;
  /** `none` while tracing, then the found star: `full` (found-b) or `small` (found-a) as it twinkles. */
  star: 'none' | 'full' | 'small';
  /** The whole logo is gold (after the star replaces the ring). */
  gold: boolean;
  /** The twinkle's dim half: the logo is drawn in a dimmer gold, exactly while the star is the small one. */
  dim: boolean;
  /** The colour of the logo: Harbor Haze while tracing, then gold or dim gold. */
  logoColour: string;
  /** The colour of the star: null while tracing, then always the same as `logoColour`. */
  starColour: string | null;
  /** The right checkpoint ring is replaced by the star. */
  ringHidden: boolean;
  done: boolean;
};

/** Index of the first cell of `MARK_TRACE.slice(from, to)` whose `d` is above `limit` (binary search; `d` is sorted there). */
const countUpTo = (from: number, to: number, limit: number): number => {
  let lo = from;
  let hi = to;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (MARK_TRACE[mid].d <= limit + 1e-9) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

/**
 * The opening animation at `elapsedMs`: the left ring is drawn, the stroke grows from it like handwriting, the star
 * replaces the right ring, the logo turns gold and the star twinkles. Nothing is drawn at 0. Reduced motion shows the
 * final state at once.
 */
export function traceFrame(elapsedMs: number, reducedMotion = false): TraceFrame {
  if (reducedMotion) {
    return {
      revealed: MARK_TRACE.length,
      star: 'full',
      gold: true,
      dim: false,
      logoColour: GOLD,
      starColour: GOLD,
      ringHidden: true,
      done: true,
    };
  }
  const t = Math.max(0, elapsedMs);
  if (t < TRACE_MS) {
    let revealed: number;
    if (t < RING_MS) revealed = countUpTo(0, LEFT_RING_COUNT, t / RING_MS);
    else if (t < RING_MS + STROKE_MS) revealed = countUpTo(LEFT_RING_COUNT, RIGHT_RING_START, ((t - RING_MS) / STROKE_MS) * STROKE_LENGTH);
    else revealed = countUpTo(RIGHT_RING_START, MARK_TRACE.length, (t - RING_MS - STROKE_MS) / END_RING_MS);
    return {
      revealed,
      star: 'none',
      gold: false,
      dim: false,
      logoColour: TRACE_COLOUR,
      starColour: null,
      ringHidden: false,
      done: false,
    };
  }
  const index = Math.min(FINALE.length - 1, Math.floor((t - TRACE_MS) / FOUND_FRAME_MS));
  const { star } = FINALE[index];
  const colour = star === 'small' ? DIM_GOLD : GOLD;
  return {
    revealed: MARK_TRACE.length,
    star,
    gold: true,
    dim: star === 'small',
    logoColour: colour,
    starColour: colour,
    ringHidden: true,
    done: t >= TRACE_MS + FINALE_MS,
  };
}

/**
 * The most the shown clock may move in one tick: a little over one 60 Hz frame, so a busy thread slows the pen but
 * never makes it jump ahead.
 */
export const MAX_ADVANCE_MS = 20;

/** The next shown time: it follows the wall clock, but never moves ahead by more than MAX_ADVANCE_MS and never backwards. */
export function advanceElapsed(shownMs: number, wallMs: number): number {
  return Math.max(shownMs, Math.min(wallMs, shownMs + MAX_ADVANCE_MS));
}

/** The mark grid with only the first `count` traced cells drawn. */
export function revealedRows(count: number): string[] {
  const grid = MARK_ROWS.map((row) => Array.from(row, () => '.'));
  for (let i = 0; i < Math.min(count, MARK_TRACE.length); i += 1) grid[MARK_TRACE[i].y][MARK_TRACE[i].x] = '0';
  return grid.map((row) => row.join(''));
}

/** The mark grid of a frame: the traced cells, minus the right ring once the star replaces it. */
export function frameRows(frame: TraceFrame): string[] {
  const rows = revealedRows(frame.revealed);
  if (!frame.ringHidden) return rows;
  return rows.map((row, y) =>
    y < RING_BOX.y0 || y > RING_BOX.y1
      ? row
      : row.slice(0, RING_BOX.x0) + '.'.repeat(RING_BOX.x1 - RING_BOX.x0 + 1) + row.slice(RING_BOX.x1 + 1),
  );
}

/** The found star: the corner of `found-b` (5 x 5, gold plus in an ink outline) and of `found-a` (3 x 3, a small cross). */
export const STAR_FULL: readonly string[] = spriteRows('found-b')
  .slice(0, 5)
  .map((row) => row.slice(0, 5));
export const STAR_SMALL: readonly string[] = spriteRows('found-a')
  .slice(0, 3)
  .map((row) => row.slice(0, 3));
