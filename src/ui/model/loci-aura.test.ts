import { contrastRatio } from '../theme/palette';
import { AURA_LEVELS, AURA_SCENE, LOCI_OFFSET, auraColors, auraGrid, auraPaths } from './loci-aura';
import { CELL_EMPTY, LOCI_COLS, lociGrid, lociPose, lociRows } from './loci';

const BG = '#000000';
const AURA = '#d8ccf2';

describe('the aura scene', () => {
  it('is 120 x 120 cells with Loci centred, nudged two rows down', () => {
    expect(AURA_SCENE).toBe(120);
    expect(LOCI_OFFSET).toEqual({ x: Math.round((120 - LOCI_COLS) / 2), y: Math.round((120 - lociRows()) / 2) + 2 });
    expect(LOCI_OFFSET).toEqual({ x: 28, y: 25 });
  });
});

describe('auraGrid', () => {
  const grid = auraGrid();
  const cells = grid.flat();
  const cx = Math.round(LOCI_OFFSET.x + (125 * LOCI_COLS) / 240);
  const cy = Math.round(LOCI_OFFSET.y + (143 * LOCI_COLS) / 240);

  it('covers the scene', () => {
    expect(grid).toHaveLength(AURA_SCENE);
    for (const row of grid) expect(row).toHaveLength(AURA_SCENE);
  });

  it('is empty outside the outline and painted inside it', () => {
    expect(grid[0][0]).toBe(0);
    expect(grid[0][AURA_SCENE - 1]).toBe(0);
    expect(grid[AURA_SCENE - 1][0]).toBe(0);
    expect(grid[AURA_SCENE - 1][AURA_SCENE - 1]).toBe(0);
    expect(cells.filter((c) => c > 0).length).toBeGreaterThan(5000);
    expect(cells.filter((c) => c === 0).length).toBeGreaterThan(1500);
  });

  it('uses at most seven levels plus empty', () => {
    expect(AURA_LEVELS).toBe(7);
    expect(cells.every((c) => Number.isInteger(c) && c >= 0 && c <= AURA_LEVELS)).toBe(true);
  });

  it('is deterministic and memoized', () => {
    expect(auraGrid()).toBe(grid);
  });

  it('is not left/right mirror symmetric', () => {
    let differing = 0;
    for (const row of grid) for (let x = 0; x < AURA_SCENE; x += 1) if (row[x] !== row[AURA_SCENE - 1 - x]) differing += 1;
    expect(differing).toBeGreaterThan(200);
  });

  it('is brightest at the body centre and fades towards the edge', () => {
    expect(grid[cy][cx]).toBe(1);
    const ring = (from: number, to: number) => {
      const out: number[] = [];
      grid.forEach((row, y) =>
        row.forEach((c, x) => {
          const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) * 0.92);
          if (d >= from && d < to && c > 0) out.push(c);
        }),
      );
      return out.reduce((sum, c) => sum + c, 0) / out.length;
    };
    expect(ring(0, 10)).toBeLessThan(ring(30, 40));
  });

  it('keeps the whole of Loci inside the aura', () => {
    const loci = lociGrid(lociPose('waiting', 0));
    loci.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell !== CELL_EMPTY) expect(grid[y + LOCI_OFFSET.y][x + LOCI_OFFSET.x]).toBeGreaterThan(0);
      }),
    );
  });
});

describe('auraColors', () => {
  const colors = auraColors(BG, AURA);

  it('gives one solid colour per level, brightest innermost, fading outward', () => {
    expect(colors).toHaveLength(AURA_LEVELS);
    const contrast = colors.map((c) => contrastRatio(c, BG));
    for (let i = 1; i < contrast.length; i += 1) expect(contrast[i]).toBeLessThan(contrast[i - 1]);
    expect(new Set(colors).size).toBe(AURA_LEVELS);
  });

  it('never reaches the full aura colour: strength is 0.65', () => {
    expect(colors[0]).toBe('#8C859D');
  });
});

describe('auraPaths', () => {
  it('returns run-length rect paths per level covering every painted cell once', () => {
    const paths = auraPaths();
    expect(Object.keys(paths).length).toBeLessThanOrEqual(AURA_LEVELS);
    let area = 0;
    for (const d of Object.values(paths)) {
      for (const m of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-(\d+)z/g)) area += Number(m[3]);
    }
    expect(area).toBe(auraGrid().flat().filter((c) => c > 0).length);
  });
});
