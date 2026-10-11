import { ROUND_OUTER, ROUND_INNER, cornerRects } from './pixel-corners';

describe('cornerRects', () => {
  it('has the rounded profiles of the design: [2, 1] outside, [1] inside', () => {
    expect(ROUND_OUTER).toEqual([2, 1]);
    expect(ROUND_INNER).toEqual([1]);
  });

  it('turns an outer profile into one block per row, each N tall', () => {
    expect(cornerRects(ROUND_OUTER, 2)).toEqual([
      { x: 0, y: 0, width: 4, height: 2 },
      { x: 0, y: 2, width: 2, height: 2 },
    ]);
  });

  it('turns the inner profile into a single N x N block', () => {
    expect(cornerRects(ROUND_INNER, 2)).toEqual([{ x: 0, y: 0, width: 2, height: 2 }]);
  });

  it('skips rows with no inset', () => {
    expect(cornerRects([0, 1], 2)).toEqual([{ x: 0, y: 2, width: 2, height: 2 }]);
  });

  it('scales with the rule width', () => {
    expect(cornerRects(ROUND_OUTER, 3)[0]).toEqual({ x: 0, y: 0, width: 6, height: 3 });
  });
});
