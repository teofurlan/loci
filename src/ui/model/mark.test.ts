import { MARK_HEIGHT, MARK_ROWS, MARK_WIDTH } from './mark';
import { spritePaths, parseGrid } from './sprites';

type Grid = readonly boolean[][];
const ink: Grid = MARK_ROWS.map((row) => Array.from(row, (ch) => ch === '0'));

function components(cells: Grid, wanted: boolean, diagonal: boolean): number {
  const seen = cells.map((row) => row.map(() => false));
  const steps = diagonal
    ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    : [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let count = 0;
  cells.forEach((row, y0) =>
    row.forEach((cell, x0) => {
      if (cell !== wanted || seen[y0][x0]) return;
      count += 1;
      const stack: [number, number][] = [[x0, y0]];
      seen[y0][x0] = true;
      while (stack.length) {
        const [x, y] = stack.pop() as [number, number];
        for (const [dx, dy] of steps) {
          const nx = x + dx;
          const ny = y + dy;
          if (ny < 0 || ny >= cells.length || nx < 0 || nx >= row.length) continue;
          if (cells[ny][nx] !== wanted || seen[ny][nx]) continue;
          seen[ny][nx] = true;
          stack.push([nx, ny]);
        }
      }
    }),
  );
  return count;
}

describe('the Loci path mark', () => {
  it('keeps the approved 96 x 112 grid of ink and transparency', () => {
    expect([MARK_WIDTH, MARK_HEIGHT]).toEqual([96, 112]);
    expect(MARK_ROWS).toHaveLength(112);
    for (const row of MARK_ROWS) {
      expect(row).toHaveLength(96);
      expect(row).toMatch(/^[.0]+$/);
    }
  });

  it('is one connected stroke with four enclosed holes: the loop and three hollow checkpoints', () => {
    expect(components(ink, true, true)).toBe(1);
    // Transparent regions: the outside plus the four holes.
    expect(components(ink, false, false)).toBe(5);
  });

  it('draws every ink cell once through the shared sprite path builder', () => {
    const paths = spritePaths(parseGrid(MARK_ROWS));
    let area = 0;
    for (const m of (paths[0] ?? '').matchAll(/h(\d+)v1/g)) area += Number(m[1]);
    expect(area).toBe(ink.flat().filter(Boolean).length);
  });
});
