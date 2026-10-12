import { RING_CENTRE } from './mark-trace';
import { SOURCE_PER_CELL } from './mark';
import { STAR_RADIUS, sparkleCells, starSprite } from './mark-star';

const bright = sparkleCells(false);
const dim = sparkleCells(true);
const key = (c: { x: number; y: number }) => `${c.x},${c.y}`;
const bounds = (cells: readonly { x: number; y: number }[]) => ({
  x0: Math.min(...cells.map((c) => c.x)),
  x1: Math.max(...cells.map((c) => c.x)),
  y0: Math.min(...cells.map((c) => c.y)),
  y1: Math.max(...cells.map((c) => c.y)),
});

describe('the four-point sparkle star', () => {
  it('sits on the right ring and is 15 source cells in radius at 100%', () => {
    expect(RING_CENTRE.x).toBeCloseTo(77 / SOURCE_PER_CELL, 9);
    expect(RING_CENTRE.y).toBeCloseTo(79 / SOURCE_PER_CELL, 9);
    expect(STAR_RADIUS).toBeCloseTo(15 / SOURCE_PER_CELL, 9);
  });

  it('is the approved shape: 89 cells bright, 36 dim', () => {
    expect(bright).toHaveLength(89);
    expect(dim).toHaveLength(36);
    expect(bounds(bright)).toEqual({ x0: 40, x1: 55, y0: 42, y1: 56 });
    expect(bounds(dim)).toEqual({ x0: 43, x1: 52, y0: 45, y1: 53 });
  });

  it('lists each cell once, and every cell satisfies the astroid rule round the star centre', () => {
    for (const [cells, radius] of [
      [bright, STAR_RADIUS],
      [dim, STAR_RADIUS * 0.62],
    ] as const) {
      expect(new Set(cells.map(key)).size).toBe(cells.length);
      for (const c of cells) {
        const dx = Math.abs(c.x + 0.5 - RING_CENTRE.x) / radius;
        const dy = Math.abs(c.y + 0.5 - RING_CENTRE.y) / radius;
        expect(dx ** 0.62 + dy ** 0.62).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });

  it('has four points: it reaches out along both axes and is hollow towards the diagonals', () => {
    const cx = Math.floor(RING_CENTRE.x);
    const cy = Math.floor(RING_CENTRE.y);
    const cells = new Set(bright.map(key));
    expect(cells.has(`${cx},${cy}`)).toBe(true);
    expect(cells.has(`${cx},${cy - 6}`)).toBe(true);
    expect(cells.has(`${cx},${cy + 6}`)).toBe(true);
    expect(cells.has(`${cx - 6},${cy}`)).toBe(true);
    expect(cells.has(`${cx + 6},${cy}`)).toBe(true);
    expect(cells.has(`${cx + 5},${cy + 5}`)).toBe(false);
    expect(cells.has(`${cx - 5},${cy - 5}`)).toBe(false);
  });

  it('has a light core on the bright frame only, near the centre', () => {
    const core = bright.filter((c) => c.light);
    expect(core).toHaveLength(6);
    for (const c of core) expect(Math.abs(c.x + 0.5 - RING_CENTRE.x) + Math.abs(c.y + 0.5 - RING_CENTRE.y)).toBeLessThanOrEqual(STAR_RADIUS * 0.18 + 1e-9);
    expect(dim.some((c) => c.light)).toBe(false);
  });

  it('draws as a small sprite: body cells `0`, light core cells `3`, placed by its origin', () => {
    for (const small of [false, true]) {
      const cells = sparkleCells(small);
      const sprite = starSprite(small);
      const b = bounds(cells);
      expect([sprite.x, sprite.y]).toEqual([b.x0, b.y0]);
      expect(sprite.rows).toHaveLength(b.y1 - b.y0 + 1);
      const seen: string[] = [];
      sprite.rows.forEach((row, y) =>
        Array.from(row).forEach((ch, x) => {
          if (ch === '.') return;
          seen.push(`${x + sprite.x},${y + sprite.y}`);
          const cell = cells.find((c) => c.x === x + sprite.x && c.y === y + sprite.y);
          expect(ch).toBe(cell?.light ? '3' : '0');
        }),
      );
      expect(new Set(seen)).toEqual(new Set(cells.map(key)));
    }
  });
});
