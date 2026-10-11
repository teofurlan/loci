import { MARK_HEIGHT, MARK_ROWS, MARK_WIDTH, SOURCE_PER_CELL } from './mark';
import {
  DIM_GOLD,
  FINALE_FRAME_MS,
  FINALE_MS,
  GOLD,
  END_RING_MS,
  LEFT_RING_COUNT,
  LIGHT_CORE,
  MAX_ADVANCE_MS,
  PEN_CELLS_PER_MS,
  RIGHT_RING_START,
  RING_MS,
  STROKE_LENGTH,
  STROKE_MS,
  TRACE_COLOUR,
  TRACE_END,
  TRACE_MS,
  MARK_TRACE,
  advanceElapsed,
  frameRows,
  isLeftRingCell,
  isRightRingCell,
  revealedRows,
  strokePoint,
  traceCells,
  traceFrame,
} from './mark-trace';
import { FOUND_FRAME_MS } from './sprites';

const inkCells = MARK_ROWS.flatMap((row, y) => Array.from(row, (ch, x) => (ch === '0' ? `${x},${y}` : null))).filter(
  (cell): cell is string => cell !== null,
);

const key = (c: { x: number; y: number }) => `${c.x},${c.y}`;

/** Number of 8-connected groups among the first `count` traced cells. */
function groupsOf(count: number): number {
  const cells = new Set(MARK_TRACE.slice(0, count).map(key));
  const seen = new Set<string>();
  let groups = 0;
  for (const start of cells) {
    if (seen.has(start)) continue;
    groups += 1;
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const [x, y] = (stack.pop() as string).split(',').map(Number);
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          const next = `${x + dx},${y + dy}`;
          if (cells.has(next) && !seen.has(next)) {
            seen.add(next);
            stack.push(next);
          }
        }
      }
    }
  }
  return groups;
}

/** How many traced cells are drawn when the pen has written `length` cells of the stroke (after the ring). */
const countAtPen = (length: number): number => {
  let n = LEFT_RING_COUNT;
  while (n < RIGHT_RING_START && MARK_TRACE[n].d <= length + 1e-9) n += 1;
  return n;
};

describe('the mark trace order', () => {
  it('traces the approved 60 x 70 grid', () => {
    expect([MARK_WIDTH, MARK_HEIGHT]).toEqual([60, 70]);
    expect(SOURCE_PER_CELL).toBeCloseTo(1.6, 12);
  });

  it('orders every ink cell exactly once and nothing else', () => {
    expect(MARK_TRACE).toHaveLength(inkCells.length);
    expect(new Set(MARK_TRACE.map(key))).toEqual(new Set(inkCells));
  });

  it('draws the left checkpoint ring first, and only the ring, before the stroke; the right ring last', () => {
    const inLeft = (c: { x: number; y: number }) => isLeftRingCell(c.x, c.y);
    const inRight = (c: { x: number; y: number }) => isRightRingCell(c.x, c.y);
    expect(LEFT_RING_COUNT).toBe(45);
    expect(MARK_TRACE.slice(0, LEFT_RING_COUNT).every(inLeft)).toBe(true);
    expect(MARK_TRACE.slice(LEFT_RING_COUNT).some(inLeft)).toBe(false);
    expect(MARK_TRACE.slice(RIGHT_RING_START).every(inRight)).toBe(true);
    expect(MARK_TRACE.slice(LEFT_RING_COUNT, RIGHT_RING_START).some(inRight)).toBe(false);
    expect(MARK_TRACE.length - RIGHT_RING_START).toBe(37);
    // the ring is hollow: its centre is not ink
    expect(MARK_ROWS[59][11]).toBe('.');
  });

  it('is monotonic: along the stroke, distances never decrease', () => {
    const stroke = MARK_TRACE.slice(LEFT_RING_COUNT, RIGHT_RING_START);
    for (let i = 1; i < stroke.length; i += 1) expect(stroke[i].d).toBeGreaterThanOrEqual(stroke[i - 1].d);
    expect(stroke[stroke.length - 1].d).toBeLessThanOrEqual(STROKE_LENGTH + 1e-9);
  });

  it('is deterministic', () => {
    expect(traceCells(MARK_ROWS)).toEqual(traceCells(MARK_ROWS));
  });

  it('starts at the left end and finishes at the right end', () => {
    const xs = inkCells.map((cell) => Number(cell.split(',')[0]));
    const leftmost = Math.min(...xs);
    const rightmost = Math.max(...xs);
    expect(MARK_TRACE[0].x).toBeLessThanOrEqual(leftmost + 9);
    expect(MARK_TRACE[MARK_TRACE.length - 1].x).toBeGreaterThanOrEqual(rightmost - 9);
    const rank = (x: number) => MARK_TRACE.findIndex((c) => c.x === x) / MARK_TRACE.length;
    expect(rank(leftmost)).toBeLessThan(0.05);
    expect(rank(rightmost)).toBeGreaterThan(0.9);
  });

  it('writes the loop like a cursive l: up the slanted right strand, over the top, then down the left stem', () => {
    const topY = Math.min(...MARK_TRACE.map((c) => c.y));
    const top = MARK_TRACE.find((c) => c.y === topY) as { d: number };
    // row 37: the left stem is at x 24 to 27, the slanted strand the pen climbs first is at x 34 to 37
    const upstroke = MARK_TRACE.find((c) => c.y === 37 && c.x >= 34 && c.x <= 37) as { d: number };
    const stem = MARK_TRACE.find((c) => c.y === 37 && c.x >= 24 && c.x <= 27) as { d: number };
    expect(upstroke.d).toBeLessThan(top.d);
    expect(top.d).toBeLessThan(stem.d);
    expect(stem.d).toBeLessThan(STROKE_LENGTH - 20);
  });

  it('the upstroke draws the crossing as it passes, so the loop never waits for the stem', () => {
    const topY = Math.min(...MARK_TRACE.map((c) => c.y));
    const top = MARK_TRACE.find((c) => c.y === topY) as { d: number };
    const crossing = MARK_TRACE.find((c) => c.x === 26 && c.y === 52) as { d: number };
    expect(MARK_ROWS[52][26]).toBe('0');
    expect(crossing.d).toBeLessThan(top.d - 20);
  });

  it('pins the handwriting order: left ring ccw from east, up the right strand, over the top, down the left stem, right ring last', () => {
    const order = MARK_TRACE.map(key);
    const at = (x: number, y: number) => order.indexOf(`${x},${y}`);
    // the left ring opens at its east side (the stroke leaves its right wall) and goes counter-clockwise: east, then north
    const ring = MARK_TRACE.slice(0, LEFT_RING_COUNT);
    const east = ring[0];
    expect(east.x).toBeGreaterThanOrEqual(14);
    expect(ring[Math.floor(LEFT_RING_COUNT / 4)].y).toBeLessThan(east.y); // a quarter turn counter-clockwise is above the start
    expect(ring[Math.floor(LEFT_RING_COUNT / 2)].x).toBeLessThan(east.x - 4); // half way round it is on the far (west) side
    // the first stroke cells climb the right strand: they leave the ring towards the upper right
    const first = MARK_TRACE.slice(LEFT_RING_COUNT, LEFT_RING_COUNT + 40);
    for (const c of first) expect(c.y).toBeGreaterThanOrEqual(45);
    expect(Math.max(...first.map((c) => c.x))).toBeGreaterThan(20);
    // the pen gets to the top of the loop before it is half way down the left stem
    expect(at(37, 6)).toBeGreaterThan(-1);
    expect(at(37, 6)).toBeLessThan(at(25, 37));
    expect(at(25, 37)).toBeLessThan(at(24, 44));
    expect(at(34, 37)).toBeLessThan(at(37, 6));
    // the pen climbs the loop's right side (x 39 to 43) before it comes down the left side (x 28 to 32)
    expect(at(42, 20)).toBeLessThan(at(28, 20));
    // the right ring (x 44 to 51, rows 46 to 52) is written after everything else
    expect(at(46, 46)).toBeGreaterThanOrEqual(RIGHT_RING_START);
    expect(at(44, 52)).toBeGreaterThanOrEqual(RIGHT_RING_START);
  });
});

describe('the pen: the stroke grows like handwriting', () => {
  it('never leaves a detached fragment: every prefix of the order is one connected stroke', () => {
    // every 3rd prefix keeps the test quick; the order is fixed, so this samples the whole growth
    for (let n = 1; n <= RIGHT_RING_START - 2; n += 3) expect({ n, groups: groupsOf(n) }).toEqual({ n, groups: 1 });
    expect(groupsOf(RIGHT_RING_START - 2)).toBe(1);
    // The one exception, as in the approved study: the last two stroke cells are the ring's east wall (their centres fall
    // just outside the ring box), so they show beside the ring while it is drawn (125 ms): the ring grows in at most
    // three pieces, which close into the one stroke.
    for (let n = RIGHT_RING_START - 1; n <= MARK_TRACE.length; n += 1) expect(groupsOf(n)).toBeLessThanOrEqual(3);
    expect(groupsOf(MARK_TRACE.length)).toBe(1);
  });

  it('the pen tip walks the centre line at even speed: the point at length L is L cells from the start', () => {
    // lengths are in source cells (the 96-wide space the line was drawn in); points come back in grid cells
    let previous = strokePoint(0);
    for (let length = 1; length <= STROKE_LENGTH; length += 1) {
      const point = strokePoint(length);
      const step = Math.hypot(point.x - previous.x, point.y - previous.y) * SOURCE_PER_CELL;
      expect(step).toBeGreaterThan(0.3);
      expect(step).toBeLessThanOrEqual(1.0001);
      previous = point;
    }
  });

  it('everything newly drawn as the pen advances lies at the tip, not ahead of it', () => {
    // half a stroke width plus the tip's step, in source cells; the ring's top cell sits just outside the ring box, so it
    // is drawn with the stroke's first cells, as in the study
    const REACH = 9;
    for (let length = 1; length <= STROKE_LENGTH + 1; length += 1) {
      const tip = strokePoint(Math.min(length, STROKE_LENGTH));
      for (let i = countAtPen(length - 1); i < countAtPen(length); i += 1) {
        const c = MARK_TRACE[i];
        const away = Math.hypot(c.x + 0.5 - tip.x, c.y + 0.5 - tip.y) * SOURCE_PER_CELL;
        expect({ length, cell: key(c), ok: away <= REACH }).toEqual({ length, cell: key(c), ok: true });
      }
    }
  });

  it('reveals a bounded amount per frame: about one stroke width of cells for each cell of pen travel', () => {
    const PER_FRAME = 2.5; // at most ~2.5 cells of pen length in a 60 Hz frame
    expect(PEN_CELLS_PER_MS * (1000 / 60)).toBeLessThanOrEqual(PER_FRAME);
    let most = 0;
    for (let length = PER_FRAME; length <= STROKE_LENGTH + PER_FRAME; length += PER_FRAME) {
      most = Math.max(most, countAtPen(length) - countAtPen(length - PER_FRAME));
    }
    expect(most).toBeLessThanOrEqual(PER_FRAME * 8 * 2);
  });
});

describe('the trace frames', () => {
  const total = TRACE_MS + FINALE_MS;

  it('draws nothing at t = 0: the native splash is plain black and the first frame matches it', () => {
    const first = traceFrame(0);
    expect(first.revealed).toBe(0);
    expect(first.star).toBe('none');
    expect(first.gold).toBe(false);
    expect(first.ringHidden).toBe(false);
    expect(first.done).toBe(false);
    expect(revealedRows(0).every((row) => /^\.+$/.test(row))).toBe(true);
  });

  it('takes 2.5 s to write: the left ring 7%, the stroke, then the right ring 5%', () => {
    expect(TRACE_MS).toBe(RING_MS + STROKE_MS + END_RING_MS);
    expect([RING_MS, STROKE_MS, END_RING_MS, TRACE_MS]).toEqual([175, 2200, 125, 2500]);
    // the ring is all there as the stroke begins (plus the stroke's first cell or two, drawn at once)
    expect(traceFrame(RING_MS).revealed).toBeGreaterThanOrEqual(LEFT_RING_COUNT);
    expect(traceFrame(RING_MS).revealed).toBeLessThanOrEqual(LEFT_RING_COUNT + 2);
    // while the ring is drawn, nothing but the ring shows
    for (let t = 0; t <= RING_MS; t += 10) expect(traceFrame(t).revealed).toBeLessThanOrEqual(LEFT_RING_COUNT);
    expect(traceFrame(RING_MS + 100).revealed).toBeGreaterThan(LEFT_RING_COUNT);
  });

  it('only grows, from the ring to the whole mark, in fine increments, with no star or gold while tracing', () => {
    let previous = 0;
    let biggestJump = 0;
    for (let t = 0; t < TRACE_MS; t += 1000 / 60) {
      const frame = traceFrame(t);
      expect(frame.revealed).toBeGreaterThanOrEqual(previous);
      biggestJump = Math.max(biggestJump, frame.revealed - previous);
      previous = frame.revealed;
      expect(frame.star).toBe('none');
      expect(frame.gold).toBe(false);
      expect(frame.logoColour).toBe(TRACE_COLOUR);
      expect(frame.starColour).toBeNull();
      expect(frame.coreColour).toBeNull();
    }
    // a 60 Hz frame adds well under a tenth of the mark (no block renders)
    expect(biggestJump).toBeLessThan(MARK_TRACE.length / 10);
    expect(previous).toBeGreaterThan(MARK_TRACE.length * 0.9);
  });

  it('when the trace ends, the star replaces the right ring and the logo turns gold, bright', () => {
    const frame = traceFrame(TRACE_MS);
    expect(frame.revealed).toBe(MARK_TRACE.length);
    expect(frame.star).toBe('full');
    expect(frame.ringHidden).toBe(true);
    expect(frame.gold).toBe(true);
    expect(frame.dim).toBe(false);
  });

  it('the finale blinks logo and star together: gold logo with the full star, dim logo with the small star', () => {
    // 220 ms frames, its own constant: the run screen's found flash keeps its 200 ms
    expect(FINALE_FRAME_MS).toBe(220);
    expect(FOUND_FRAME_MS).toBe(200);
    const at = (i: number) => traceFrame(TRACE_MS + i * FINALE_FRAME_MS + 1);
    expect([0, 1, 2, 3, 4].map((i) => at(i).star)).toEqual(['full', 'small', 'full', 'small', 'full']);
    for (let i = 0; i < 5; i += 1) {
      expect(at(i).gold).toBe(true);
      expect(at(i).ringHidden).toBe(true);
      expect(at(i).dim).toBe(at(i).star === 'small');
    }
  });

  it('the star is always the logo colour in the finale, and gold only: bright #ffcd75, dim #806a46, never violet', () => {
    expect(GOLD).toBe('#ffcd75');
    expect(DIM_GOLD).toBe('#806a46');
    expect(LIGHT_CORE).toBe('#fff3d6');
    expect(TRACE_COLOUR).toBe('#a99cc2');
    expect(TRACE_COLOUR).not.toBe(GOLD);
    const seen = new Set<string>();
    for (let t = TRACE_MS; t <= TRACE_MS + FINALE_MS + 50; t += 7) {
      const frame = traceFrame(t);
      // only the bright frame has the light core
      expect(frame.coreColour).toBe(frame.dim ? null : LIGHT_CORE);
      expect(frame.starColour).not.toBeNull();
      expect(frame.starColour).toBe(frame.logoColour);
      expect(frame.logoColour).toBe(frame.dim ? DIM_GOLD : GOLD);
      expect([GOLD, DIM_GOLD]).toContain(frame.starColour);
      expect(frame.starColour).not.toBe(TRACE_COLOUR);
      seen.add(frame.starColour as string);
    }
    expect(seen).toEqual(new Set([GOLD, DIM_GOLD]));
    // the reduced-motion still is the bright state
    const still = traceFrame(0, true);
    expect(still.logoColour).toBe(GOLD);
    expect(still.starColour).toBe(GOLD);
    expect(still.coreColour).toBe(LIGHT_CORE);
  });

  it('keeps the dim gold readable on the black field (at least 3:1) and the pen light on it', () => {
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const onBlack = (hex: string) => (luminance(hex) + 0.05) / 0.05;
    expect(onBlack(DIM_GOLD)).toBeGreaterThanOrEqual(3);
    expect(onBlack(TRACE_COLOUR)).toBeGreaterThanOrEqual(7);
  });

  it('never dims while tracing', () => {
    for (let t = 0; t < TRACE_MS; t += 20) expect(traceFrame(t).dim).toBe(false);
  });

  it('advanceElapsed follows the clock but never moves more than about one frame at a time', () => {
    expect(MAX_ADVANCE_MS).toBeGreaterThanOrEqual(1000 / 60);
    expect(MAX_ADVANCE_MS).toBeLessThanOrEqual(25);
    expect(advanceElapsed(0, 10)).toBe(10);
    expect(advanceElapsed(100, 100)).toBe(100);
    expect(advanceElapsed(0, 700)).toBe(MAX_ADVANCE_MS);
    expect(advanceElapsed(500, 480)).toBe(500);
  });

  it('a busy thread (ticks 300 ms apart) slows the pen, never jumps it ahead: bounded growth every tick', () => {
    let shown = 0;
    let before = 0;
    let ticks = 0;
    for (let wall = 0; wall < 60000 && !traceFrame(shown).done; wall += 300) {
      shown = advanceElapsed(shown, wall);
      const now = traceFrame(shown).revealed;
      // one tick moves the pen at most MAX_ADVANCE_MS of travel, so at most that many stroke widths of cells
      expect(now - before).toBeLessThanOrEqual(Math.ceil(MAX_ADVANCE_MS * PEN_CELLS_PER_MS) * 8 * 2);
      before = now;
      ticks += 1;
    }
    expect(traceFrame(shown).done).toBe(true);
    expect(ticks).toBeGreaterThan(total / MAX_ADVANCE_MS - 5);
  });

  it('twinkles twice (five frames: bright, dim, bright, dim, bright) and fits the cold-start budget', () => {
    const smalls = [0, 1, 2, 3, 4].filter((i) => traceFrame(TRACE_MS + i * FINALE_FRAME_MS + 1).star === 'small').length;
    expect(smalls).toBe(2);
    expect(FINALE_MS).toBe(5 * FINALE_FRAME_MS);
    expect(total).toBe(3600);
  });

  it('ends done on the last frame, bright: gold with the full star', () => {
    expect(traceFrame(total).done).toBe(true);
    expect(traceFrame(total - 1).done).toBe(false);
    const last = traceFrame(total);
    expect(last.gold).toBe(true);
    expect(last.star).toBe('full');
    expect(last.dim).toBe(false);
  });

  it('clamps negative and huge times', () => {
    expect(traceFrame(-50)).toEqual(traceFrame(0));
    expect(traceFrame(1e9).revealed).toBe(MARK_TRACE.length);
  });

  it('reduced motion shows the final state at once: gold logo, full star, no twinkle, already done', () => {
    const frame = traceFrame(0, true);
    expect(frame.revealed).toBe(MARK_TRACE.length);
    expect(frame.star).toBe('full');
    expect(frame.gold).toBe(true);
    expect(frame.ringHidden).toBe(true);
    expect(frame.done).toBe(true);
    expect(traceFrame(12345, true)).toEqual(frame);
  });
});

describe('the right ring and the star', () => {
  const ringCells = MARK_TRACE.slice(RIGHT_RING_START);

  it('the right ring is the last cells drawn: ink round a hollow centre, the trace ends on its far side', () => {
    const ink = (x: number, y: number) => MARK_ROWS[y][x] === '0';
    const xs = ringCells.map((c) => c.x);
    const ys = ringCells.map((c) => c.y);
    expect([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]).toEqual([44, 51, 46, 52]);
    expect(ink(47, 49)).toBe(false);
    expect(ink(44, 49)).toBe(true);
    expect(ink(52, 49)).toBe(true);
    expect(ink(47, 46)).toBe(true);
    expect(isRightRingCell(TRACE_END.x, TRACE_END.y)).toBe(true);
    expect(ringCells.every((c) => isRightRingCell(c.x, c.y))).toBe(true);
  });

  it('hides exactly the ring cells once the star shows, and keeps every other cell', () => {
    const shown = frameRows(traceFrame(TRACE_MS));
    shown.forEach((row, y) =>
      Array.from(row).forEach((ch, x) => {
        const expected = isRightRingCell(x, y) ? '.' : MARK_ROWS[y][x];
        expect(ch).toBe(expected);
      }),
    );
  });

  it('draws the whole mark, ring included, while tracing and under no star', () => {
    expect(frameRows(traceFrame(TRACE_MS - 1)).join('')).toBe(revealedRows(traceFrame(TRACE_MS - 1).revealed).join(''));
  });
});

describe('revealed rows', () => {
  it('draws only revealed cells and the full mark at the end', () => {
    expect(revealedRows(MARK_TRACE.length)).toEqual(MARK_ROWS);
    const none = revealedRows(0);
    expect(none.every((row) => /^\.+$/.test(row))).toBe(true);
    const some = revealedRows(10);
    expect(some.join('').split('0').length - 1).toBe(10);
  });

  it('keeps the ring frame inside the left end of the mark', () => {
    const first = revealedRows(traceFrame(RING_MS).revealed);
    const xs = first.flatMap((row) => Array.from(row, (ch, x) => (ch === '0' ? x : -1))).filter((x) => x >= 0);
    expect(Math.max(...xs)).toBeLessThan(19);
  });
});

describe('the trailing end', () => {
  it('sits in the right checkpoint ring, where the star replaces it', () => {
    expect(TRACE_END.x).toBeGreaterThan(43);
    expect(TRACE_END.x).toBeLessThan(52);
    expect(TRACE_END.y).toBeGreaterThan(45);
    expect(TRACE_END.y).toBeLessThan(53);
  });
});
