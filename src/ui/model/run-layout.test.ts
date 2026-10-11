import { CELLS } from './chat-layout';
import { RUN_CELL_MAX, RUN_CELL_MIN, runCellDp, runStageSize } from './run-layout';

const small = { width: 360, height: 760, insetTop: 0, insetBottom: 0 };

describe('runCellDp', () => {
  it('gives 2 dp per cell (a 240 dp stage) on a 360 x 760 phone', () => {
    expect(runCellDp(small)).toBe(2);
    expect(runStageSize(small)).toBe(2 * CELLS);
  });

  it('stays a whole dp inside the limits', () => {
    for (const height of [300, 500, 640, 760, 921, 1400, 2400]) {
      const dp = runCellDp({ ...small, height });
      expect(Number.isInteger(dp)).toBe(true);
      expect(dp).toBeGreaterThanOrEqual(RUN_CELL_MIN);
      expect(dp).toBeLessThanOrEqual(RUN_CELL_MAX);
    }
  });

  it('shrinks to 1 dp when the window is short', () => {
    expect(runCellDp({ ...small, height: 560 })).toBe(1);
  });

  it('grows to 3 dp on a tall, wide screen', () => {
    expect(runCellDp({ width: 600, height: 1400, insetTop: 24, insetBottom: 48 })).toBe(3);
  });

  it('is limited by the width', () => {
    expect(runCellDp({ width: 200, height: 2400, insetTop: 0, insetBottom: 0 })).toBe(1);
  });

  it('counts the system insets', () => {
    expect(runCellDp({ ...small, insetTop: 200 })).toBeLessThan(runCellDp(small));
  });
});
