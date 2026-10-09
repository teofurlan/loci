import { PUNCH_GRID, punchPattern } from './punch-pattern';

describe('punchPattern', () => {
  it('is deterministic per control number', () => {
    expect(punchPattern(3)).toEqual(punchPattern(3));
  });

  it('is different for the first twelve controls', () => {
    const keys = Array.from({ length: 12 }, (_, i) => punchPattern(i).join(','));
    expect(new Set(keys).size).toBe(12);
  });

  it('punches 4 to 7 pins, each inside the grid, with no repeats', () => {
    for (let i = 0; i < 30; i++) {
      const pins = punchPattern(i);
      expect(pins.length).toBeGreaterThanOrEqual(4);
      expect(pins.length).toBeLessThanOrEqual(7);
      expect(new Set(pins).size).toBe(pins.length);
      pins.forEach((p) => {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThan(PUNCH_GRID * PUNCH_GRID);
      });
    }
  });
});
