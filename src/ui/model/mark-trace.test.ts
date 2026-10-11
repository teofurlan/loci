import { MARK_ROWS } from './mark';
import {
  FINALE_MS,
  MARK_TRACE,
  RING_BOX,
  STAR_FULL,
  STAR_SMALL,
  TRACE_MS,
  TRACE_STEPS,
  frameRows,
  revealedRows,
  traceCells,
  traceFrame,
  TRACE_END,
} from './mark-trace';
import { FOUND_FRAMES, FOUND_FRAME_MS, spriteRows } from './sprites';

const inkCells = MARK_ROWS.flatMap((row, y) => Array.from(row, (ch, x) => (ch === '0' ? `${x},${y}` : null))).filter(
  (cell): cell is string => cell !== null,
);

describe('the mark trace order', () => {
  it('orders every ink cell exactly once and nothing else', () => {
    expect(MARK_TRACE).toHaveLength(inkCells.length);
    expect(new Set(MARK_TRACE.map((c) => `${c.x},${c.y}`))).toEqual(new Set(inkCells));
  });

  it('is monotonic: distances never decrease along the order', () => {
    for (let i = 1; i < MARK_TRACE.length; i += 1) expect(MARK_TRACE[i].d).toBeGreaterThanOrEqual(MARK_TRACE[i - 1].d);
  });

  it('is deterministic', () => {
    expect(traceCells(MARK_ROWS)).toEqual(traceCells(MARK_ROWS));
  });

  it('starts at the left end and finishes at the right end', () => {
    const xs = inkCells.map((cell) => Number(cell.split(',')[0]));
    const leftmost = Math.min(...xs);
    const rightmost = Math.max(...xs);
    // The first cell is in the left checkpoint ring; the very last cell belongs to the right checkpoint ring.
    expect(MARK_TRACE[0].x).toBeLessThanOrEqual(leftmost + 6);
    expect(MARK_TRACE[MARK_TRACE.length - 1].x).toBeGreaterThanOrEqual(rightmost - 10);
    // Nothing at the far right is drawn before most of the stroke, nothing at the far left is drawn late.
    const rank = (x: number) => MARK_TRACE.findIndex((c) => c.x === x) / MARK_TRACE.length;
    expect(rank(leftmost)).toBeLessThan(0.05);
    expect(rank(rightmost)).toBeGreaterThan(0.9);
  });

  it('follows the stroke: the top of the loop comes after the left stem and before the right ring', () => {
    const topY = Math.min(...MARK_TRACE.map((c) => c.y));
    const top = MARK_TRACE.find((c) => c.y === topY) as { d: number };
    const stem = MARK_TRACE.find((c) => c.y === 60 && c.x >= 38 && c.x <= 44) as { d: number };
    const end = MARK_TRACE[MARK_TRACE.length - 1];
    expect(stem.d).toBeLessThan(top.d);
    expect(top.d).toBeLessThan(end.d);
  });
});

describe('the trace frames', () => {
  const total = TRACE_MS + FINALE_MS;

  it('starts with only the lead-in of the path, ink-light, no star', () => {
    const first = traceFrame(0);
    expect(first.step).toBe(0);
    expect(first.revealed).toBeGreaterThan(0);
    expect(first.revealed).toBeLessThan(MARK_TRACE.length / 10);
    expect(first.star).toBe('none');
    expect(first.gold).toBe(false);
    expect(first.ringHidden).toBe(false);
    expect(first.done).toBe(false);
  });

  it('advances in whole steps, never backwards', () => {
    let previous = -1;
    const seen = new Set<number>();
    for (let t = 0; t < TRACE_MS; t += 5) {
      const frame = traceFrame(t);
      expect(frame.revealed).toBeGreaterThanOrEqual(previous);
      previous = frame.revealed;
      seen.add(frame.step);
      expect(frame.star).toBe('none');
      expect(frame.gold).toBe(false);
    }
    expect(seen.size).toBe(TRACE_STEPS);
  });

  it('when the trace ends, the star replaces the right ring and the logo is still not gold', () => {
    const frame = traceFrame(TRACE_MS);
    expect(frame.revealed).toBe(MARK_TRACE.length);
    expect(frame.star).toBe('full');
    expect(frame.ringHidden).toBe(true);
    expect(frame.gold).toBe(false);
  });

  it('then the whole logo turns gold and the star twinkles on the found cadence', () => {
    // Frame i of the finale lasts FOUND_FRAME_MS; the star alternates full (found-b) and small (found-a), starting full like the found flash.
    const at = (i: number) => traceFrame(TRACE_MS + i * FOUND_FRAME_MS + 1);
    expect([0, 1, 2, 3, 4].map((i) => at(i).star)).toEqual(['full', 'small', 'full', 'small', 'full']);
    expect([0, 1, 2, 3, 4].map((i) => at(i).gold)).toEqual([false, true, true, true, true]);
    expect(FOUND_FRAMES[1]).toBe('found-b');
    for (let i = 0; i < 5; i += 1) expect(at(i).ringHidden).toBe(true);
  });

  it('twinkles at least twice and fits the cold-start budget', () => {
    const smalls = [0, 1, 2, 3, 4].filter((i) => traceFrame(TRACE_MS + i * FOUND_FRAME_MS + 1).star === 'small').length;
    expect(smalls).toBeGreaterThanOrEqual(2);
    expect(FINALE_MS).toBeLessThanOrEqual(1000);
    expect(total).toBeLessThanOrEqual(2200);
  });

  it('ends done on the last frame, still gold with the full star', () => {
    expect(traceFrame(total).done).toBe(true);
    expect(traceFrame(total - 1).done).toBe(false);
    const last = traceFrame(total);
    expect(last.gold).toBe(true);
    expect(last.star).toBe('full');
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
  const inBox = (x: number, y: number) => x >= RING_BOX.x0 && x <= RING_BOX.x1 && y >= RING_BOX.y0 && y <= RING_BOX.y1;

  it('the ring box encloses the last checkpoint ring: ink on every edge, hollow centre', () => {
    const ink = (x: number, y: number) => MARK_ROWS[y][x] === '0';
    const cx = Math.floor((RING_BOX.x0 + RING_BOX.x1) / 2);
    const cy = Math.floor((RING_BOX.y0 + RING_BOX.y1) / 2);
    expect(ink(cx, cy)).toBe(false);
    expect(ink(RING_BOX.x0, cy)).toBe(true);
    expect(ink(RING_BOX.x1, cy)).toBe(true);
    expect(ink(cx, RING_BOX.y0)).toBe(true);
    expect(MARK_TRACE.some((c) => c.x === RING_BOX.x1 && inBox(c.x, c.y))).toBe(true);
    expect(TRACE_END.x).toBeGreaterThanOrEqual(RING_BOX.x0);
    expect(inBox(TRACE_END.x, TRACE_END.y)).toBe(true);
  });

  it('hides exactly the ring cells once the star shows, and keeps every other cell', () => {
    const shown = frameRows(traceFrame(TRACE_MS));
    shown.forEach((row, y) =>
      Array.from(row).forEach((ch, x) => {
        const expected = inBox(x, y) ? '.' : MARK_ROWS[y][x];
        expect(ch).toBe(expected);
      }),
    );
  });

  it('draws the whole mark, ring included, while tracing and under no star', () => {
    expect(frameRows(traceFrame(TRACE_MS - 1)).join('')).toBe(revealedRows(traceFrame(TRACE_MS - 1).revealed).join(''));
  });

  it('the two star frames are the found sprite corners (found-b full, found-a small)', () => {
    expect(STAR_FULL).toEqual(spriteRows('found-b').slice(0, 5).map((r) => r.slice(0, 5)));
    expect(STAR_SMALL).toEqual(spriteRows('found-a').slice(0, 3).map((r) => r.slice(0, 3)));
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

  it('keeps the first frame inside the left end of the mark', () => {
    const first = revealedRows(traceFrame(0).revealed);
    const xs = first.flatMap((row) => Array.from(row, (ch, x) => (ch === '0' ? x : -1))).filter((x) => x >= 0);
    expect(Math.max(...xs)).toBeLessThan(30);
  });
});

describe('the trailing end', () => {
  it('sits in the right checkpoint ring, where the star replaces it', () => {
    expect(TRACE_END.x).toBeGreaterThan(70);
    expect(TRACE_END.x).toBeLessThan(90);
    expect(TRACE_END.y).toBeGreaterThan(60);
    expect(TRACE_END.y).toBeLessThan(85);
  });
});
