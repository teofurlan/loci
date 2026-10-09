import { mapHeight, punchColumns } from './layout';

describe('mapHeight', () => {
  it('keeps the original 55% share at the default font scale on a tall window', () => {
    expect(mapHeight(1200, 1)).toBe(660);
  });

  it('gives the map less as the font scale grows, so the story keeps its room', () => {
    expect(mapHeight(806, 1.3)).toBeLessThan(mapHeight(806, 1.15));
    expect(mapHeight(806, 1.15)).toBeLessThan(mapHeight(806, 1));
  });

  it('leaves room for two story rows at font scale 1.3 on a 921 dp window', () => {
    expect(921 - mapHeight(921, 1.3)).toBeGreaterThanOrEqual(585);
  });

  it('never collapses below a usable map', () => {
    expect(mapHeight(400, 2)).toBe(160);
  });
});

describe('punchColumns', () => {
  it('uses one row up to four controls', () => {
    expect([1, 2, 3, 4].map(punchColumns)).toEqual([1, 2, 3, 4]);
  });

  it('balances two rows for five to eight controls, never a 4+1 orphan', () => {
    expect([5, 6, 7, 8].map(punchColumns)).toEqual([3, 3, 4, 4]);
  });
});
