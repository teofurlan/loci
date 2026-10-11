import { MARK_ROWS } from './mark';
import {
  MARK_TRACE,
  SPARKLE_MS,
  TRACE_MS,
  TRACE_STEPS,
  revealedRows,
  traceCells,
  traceFrame,
  TRACE_END,
} from './mark-trace';

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
  const total = TRACE_MS + SPARKLE_MS;

  it('starts with only the lead-in of the path and no sparkle', () => {
    const first = traceFrame(0);
    expect(first.step).toBe(0);
    expect(first.revealed).toBeGreaterThan(0);
    expect(first.revealed).toBeLessThan(MARK_TRACE.length / 10);
    expect(first.sparkle).toBe(0);
    expect(first.done).toBe(false);
  });

  it('advances in whole steps, never backwards', () => {
    let previous = -1;
    const seen = new Set<number>();
    for (let t = 0; t <= TRACE_MS; t += 5) {
      const frame = traceFrame(t);
      expect(frame.revealed).toBeGreaterThanOrEqual(previous);
      previous = frame.revealed;
      seen.add(frame.step);
    }
    expect(seen.size).toBe(TRACE_STEPS + 1);
  });

  it('reveals the whole mark when the trace ends, then pops the sparkle', () => {
    const traced = traceFrame(TRACE_MS);
    expect(traced.revealed).toBe(MARK_TRACE.length);
    expect(traced.sparkle).toBe(1);
    expect(traceFrame(TRACE_MS + SPARKLE_MS * 0.9).sparkle).toBe(2);
    expect(traceFrame(total).done).toBe(true);
    expect(traceFrame(total - 1).done).toBe(false);
  });

  it('clamps negative and huge times', () => {
    expect(traceFrame(-50)).toEqual(traceFrame(0));
    expect(traceFrame(1e9).revealed).toBe(MARK_TRACE.length);
  });

  it('reduced motion shows the full mark at once, no sparkle, already done', () => {
    const frame = traceFrame(0, true);
    expect(frame.revealed).toBe(MARK_TRACE.length);
    expect(frame.sparkle).toBe(0);
    expect(frame.done).toBe(true);
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
  it('sits in the right checkpoint ring, where the sparkle pops', () => {
    expect(TRACE_END.x).toBeGreaterThan(70);
    expect(TRACE_END.x).toBeLessThan(90);
    expect(TRACE_END.y).toBeGreaterThan(60);
    expect(TRACE_END.y).toBeLessThan(85);
  });
});
