import { CELL_MAX, CELL_MIN, CELLS, stageCellDp, stageSize } from './chat-layout';

const phone = { width: 411, height: 921, insetTop: 24, insetBottom: 48 };

describe('stageCellDp', () => {
  it('uses a whole number of dp per cell inside 2 to 3', () => {
    for (const height of [500, 700, 921, 1200, 2000]) {
      const dp = stageCellDp({ ...phone, height });
      expect(Number.isInteger(dp)).toBe(true);
      expect(dp).toBeGreaterThanOrEqual(CELL_MIN);
      expect(dp).toBeLessThanOrEqual(CELL_MAX);
    }
  });

  it('takes the minimum on this phone, where the keyboard leaves little room', () => {
    expect(stageCellDp(phone)).toBe(2);
  });

  it('grows to the maximum on a tall screen', () => {
    expect(stageCellDp({ width: 600, height: 1600, insetTop: 24, insetBottom: 48 })).toBe(3);
  });

  it('is limited by the width', () => {
    expect(stageCellDp({ width: 300, height: 2000, insetTop: 0, insetBottom: 0 })).toBe(2);
  });

  it('depends only on the window, never on what the screen shows', () => {
    expect(stageCellDp(phone)).toBe(stageCellDp({ ...phone }));
  });

  it('never drops below the minimum on a tiny window', () => {
    expect(stageCellDp({ width: 200, height: 300, insetTop: 0, insetBottom: 0 })).toBe(CELL_MIN);
  });
});

describe('stageSize', () => {
  it('is the cell dp times the 120 cells of the scene', () => {
    expect(CELLS).toBe(120);
    expect(stageSize(phone)).toBe(240);
  });
});
