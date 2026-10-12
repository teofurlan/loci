import {
  CELL_BASE,
  CELL_EMPTY,
  CELL_EYE,
  CELL_LIGHT,
  CELL_SHADE,
  LOCI_COLS,
  LOCI_FPS,
  frameAt,
  frameSeconds,
  lociGrid,
  lociPaths,
  lociPose,
  lociRows,
  type LociCell,
  type LociPose,
} from './loci';

const REST: LociPose = { float: 0, blink: 1, tilt: 0, eyes: [0, 0] };
const SCALE = LOCI_COLS / 240;

type Grid = readonly (readonly LociCell[])[];

function count(grid: Grid, value: LociCell): number {
  return grid.reduce((sum, row) => sum + row.filter((c) => c === value).length, 0);
}

/** 4-connected groups of one cell value, each as its bounding box and cell count. */
function blocks(grid: Grid, value: LociCell) {
  const seen = new Set<string>();
  const out: { w: number; h: number; cells: number }[] = [];
  grid.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell !== value || seen.has(`${x},${y}`)) return;
      const stack: [number, number][] = [[x, y]];
      seen.add(`${x},${y}`);
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let cells = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop() as [number, number];
        cells += 1;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (grid[ny]?.[nx] === value && !seen.has(`${nx},${ny}`)) {
            seen.add(`${nx},${ny}`);
            stack.push([nx, ny]);
          }
        }
      }
      out.push({ w: maxX - minX + 1, h: maxY - minY + 1, cells });
    }),
  );
  return out;
}

const cellsOf = (grid: Grid, value: LociCell): [number, number][] =>
  grid.flatMap((row, y) => row.flatMap((c, x) => (c === value ? [[x, y] as [number, number]] : [])));

describe('frame quantization', () => {
  it('samples at 12 fps', () => {
    expect(LOCI_FPS).toBe(12);
    expect(frameAt(0)).toBe(0);
    expect(frameAt(0.0834)).toBe(1);
    expect(frameAt(1)).toBe(12);
    expect(frameSeconds(6)).toBeCloseTo(0.5, 10);
  });
});

describe('lociPose', () => {
  it('floats from +5 down to -5 and back over 5.6 s', () => {
    expect(lociPose('waiting', 0).float).toBeCloseTo(5, 10);
    expect(lociPose('waiting', 2.8).float).toBeCloseTo(-5, 10);
    expect(lociPose('waiting', 5.6).float).toBeCloseTo(5, 10);
    expect(lociPose('waiting', 1.4).float).toBeCloseTo(0, 10);
  });

  it('blinks to 0.12 for one 1% step of the 8.5 s cycle and is open otherwise', () => {
    expect(lociPose('waiting', 0).blink).toBe(1);
    expect(lociPose('waiting', 0.43 * 8.5).blink).toBeCloseTo(0.12, 10);
    expect(lociPose('waiting', 8.4).blink).toBe(1);
  });

  it('waiting glances toward [1, 4] and returns', () => {
    expect(lociPose('waiting', 0).eyes).toEqual([0, 0]);
    const held = lociPose('waiting', 4.5).eyes;
    expect(held[0]).toBeCloseTo(1, 10);
    expect(held[1]).toBeCloseTo(4, 10);
    expect(lociPose('waiting', 9).eyes).toEqual([0, 0]);
    expect(lociPose('waiting', 4.5).tilt).toBe(0);
  });

  it('listening holds a -7 tilt and eyes [-7, -2] at 50% of its 7 s period', () => {
    const pose = lociPose('listening', 3.5);
    expect(pose.tilt).toBeCloseTo(-7, 10);
    expect(pose.eyes[0]).toBeCloseTo(-7, 10);
    expect(pose.eyes[1]).toBeCloseTo(-2, 10);
    expect(lociPose('listening', 0).tilt).toBe(0);
  });

  it('hint holds a 5 tilt and eyes [8, 0] at 50% of its 8 s period', () => {
    const pose = lociPose('hint', 4);
    expect(pose.tilt).toBeCloseTo(5, 10);
    expect(pose.eyes[0]).toBeCloseTo(8, 10);
    expect(pose.eyes[1]).toBeCloseTo(0, 10);
  });

  it('eases in and out between keyframes', () => {
    // listening ramps 0 -> -7 between 15% and 35% of 7 s; halfway through is exactly half
    expect(lociPose('listening', 7 * 0.25).tilt).toBeCloseTo(-3.5, 10);
    // and a tenth of the way in it has barely moved (ease-in), unlike a linear ramp (-0.7)
    expect(Math.abs(lociPose('listening', 7 * 0.17).tilt)).toBeLessThan(0.1);
  });

  it('attentive holds the waiting glance toward the input all the time', () => {
    for (const t of [0, 1, 4.5, 9]) {
      expect(lociPose('waiting', t, { attentive: true }).eyes).toEqual([1, 4]);
    }
    // attentive only applies to waiting
    expect(lociPose('listening', 0, { attentive: true }).eyes).toEqual([0, 0]);
  });

  it('reduced motion returns the still poses', () => {
    const opts = { reducedMotion: true };
    expect(lociPose('waiting', 3, opts)).toEqual({ float: 0, blink: 1, tilt: 0, eyes: [0, 0] });
    expect(lociPose('listening', 3, opts)).toEqual({ float: 0, blink: 1, tilt: -7, eyes: [-7, -2] });
    expect(lociPose('hint', 3, opts)).toEqual({ float: 0, blink: 1, tilt: 5, eyes: [8, 0] });
    expect(lociPose('waiting', 3, { ...opts, attentive: true }).eyes).toEqual([1, 4]);
  });
});

describe('celebrate pose', () => {
  const BEAT = 60 / 72;

  it('sits at an end of the swing on the beat: swayed, tilted, raised and unsquashed', () => {
    const pose = lociPose('celebrate', 0);
    expect(Math.abs(pose.sway ?? 0)).toBeCloseTo(8, 10);
    expect(Math.abs(pose.tilt)).toBeCloseTo(3.5, 10);
    expect(pose.float).toBeCloseTo(-9, 10);
    expect(pose.squash ?? 0).toBeCloseTo(0, 10);
    expect(pose.happy).toBe(true);
    // the two ends of the swing are mirror images, one beat apart
    const other = lociPose('celebrate', BEAT);
    expect(other.sway).toBeCloseTo(-(pose.sway ?? 0), 10);
    expect(other.tilt).toBeCloseTo(-pose.tilt, 10);
  });

  it('is mid-swing, lowest and squashed half a beat in', () => {
    const pose = lociPose('celebrate', BEAT / 2);
    expect(pose.sway ?? 0).toBeCloseTo(0, 10);
    expect(pose.tilt).toBeCloseTo(0, 10);
    expect(pose.float).toBeCloseTo(0, 10);
    expect(pose.squash).toBeCloseTo(0.07, 10);
  });

  it('repeats every two beats and rises on every beat', () => {
    for (const t of [0, 0.3, BEAT / 2, 1.1]) {
      const a = lociPose('celebrate', t);
      const b = lociPose('celebrate', t + 2 * BEAT);
      expect(b.sway).toBeCloseTo(a.sway ?? 0, 10);
      expect(b.tilt).toBeCloseTo(a.tilt, 10);
      expect(b.float).toBeCloseTo(a.float, 10);
      expect(b.squash).toBeCloseTo(a.squash ?? 0, 10);
    }
    expect(lociPose('celebrate', BEAT).float).toBeCloseTo(-9, 10);
  });

  it('never tilts past one step either way, and ignores attentive', () => {
    for (let i = 0; i < 40; i += 1) {
      const pose = lociPose('celebrate', i * 0.05, { attentive: true });
      expect(Math.abs(pose.tilt)).toBeLessThanOrEqual(3.5 + 1e-9);
      expect(pose.blink).toBe(1);
      expect(pose.eyes).toEqual([0, 0]);
    }
  });

  it('holds a still pose under reduced motion: no sway, rise, tilt or squash, but happy eyes', () => {
    const still = lociPose('celebrate', 0.4, { reducedMotion: true });
    expect(still).toEqual({ float: 0, blink: 1, tilt: 0, eyes: [0, 0], sway: 0, squash: 0, happy: true });
    expect(lociPose('celebrate', 1.9, { reducedMotion: true })).toEqual(still);
  });

  it('leaves the pose of the other states free of celebrate fields', () => {
    for (const state of ['waiting', 'listening', 'hint'] as const) {
      const pose = lociPose(state, 2);
      expect(pose.sway).toBeUndefined();
      expect(pose.squash).toBeUndefined();
      expect(pose.happy).toBeUndefined();
    }
  });
});

describe('celebrate grid', () => {
  const CHEVRON = ['..XX..', '.XXXX.', 'XX..XX', 'X....X'];
  const still = lociPose('celebrate', 0, { reducedMotion: true });
  const stillGrid = lociGrid(still);
  const firstBody = (g: Grid) => g.findIndex((row) => row.some((c) => c !== CELL_EMPTY));
  const lastBody = (g: Grid) => g.length - 1 - [...g].reverse().findIndex((row) => row.some((c) => c !== CELL_EMPTY));
  const bodyCols = (g: Grid) => g.map((row) => row.filter((c) => c !== CELL_EMPTY).length);

  it('draws two closed chevron eyes and no pill eyes', () => {
    const eyes = blocks(stillGrid, CELL_EYE);
    expect(eyes).toHaveLength(2);
    for (const eye of eyes) {
      expect(eye.w).toBe(6);
      expect(eye.h).toBe(4);
      expect(eye.cells).toBe(CHEVRON.join('').replace(/\./g, '').length);
    }
    const [left] = cellsOf(stillGrid, CELL_EYE).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    CHEVRON.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        expect(stillGrid[left[1] + y][left[0] - 2 + x] === CELL_EYE).toBe(ch === 'X');
      }),
    );
  });

  it('is the same grid as the rest sprite apart from the eyes', () => {
    const rest = lociGrid(REST);
    const strip = (g: Grid) => g.map((row) => row.map((c) => (c === CELL_EYE ? CELL_BASE : c)).join(''));
    expect(strip(stillGrid)).toEqual(strip(rest));
  });

  it('moves the body sideways by whole cells with the sway', () => {
    const left = lociGrid(lociPose('celebrate', 0)); // one end of the swing
    const right = lociGrid(lociPose('celebrate', 60 / 72)); // the other end
    const centroid = (g: Grid) => {
      const pts = cellsOf(g, CELL_BASE);
      return pts.reduce((s, p) => s + p[0], 0) / pts.length;
    };
    expect(Math.abs(centroid(left) - centroid(right))).toBeGreaterThan(3);
    expect(left).not.toBe(right);
  });

  it('raises the body on the beat and squashes it half a beat later', () => {
    const up = lociGrid(lociPose('celebrate', 0));
    const down = lociGrid(lociPose('celebrate', 60 / 72 / 2));
    // 9 view units is about 2.4 cells up; the squash keeps the foot on the ground
    expect(firstBody(up)).toBeLessThan(firstBody(down));
    expect(lastBody(up)).toBeLessThan(lastBody(down) + 1);
    const height = (g: Grid) => lastBody(g) - firstBody(g);
    expect(height(down)).toBeLessThan(height(up));
    // squash widens the body
    expect(Math.max(...bodyCols(down))).toBeGreaterThanOrEqual(Math.max(...bodyCols(up)));
  });

  it('squashes by whole rows only: tiny squash values do not change the grid', () => {
    const base = lociPose('celebrate', 0);
    expect(lociGrid({ ...base, squash: 0.005 })).toBe(lociGrid({ ...base, squash: 0 }));
    expect(lociGrid({ ...base, squash: 0.07 })).not.toBe(lociGrid({ ...base, squash: 0 }));
  });

  it('snaps the sway to whole cells and returns the identical grid for held poses', () => {
    const base = lociPose('celebrate', 0);
    const cell = 1 / SCALE;
    expect(lociGrid({ ...base, sway: 2 })).toBe(lociGrid({ ...base, sway: cell }));
    expect(lociGrid({ ...base })).toBe(lociGrid({ ...base }));
    expect(lociGrid({ ...base, tilt: 3.5 })).toBe(lociGrid({ ...base, tilt: 3 }));
  });

  it('does not change the pill-eyed states', () => {
    for (const state of ['waiting', 'listening', 'hint'] as const) {
      const grid = lociGrid(lociPose(state, 3));
      expect(JSON.stringify(grid)).toBe(JSON.stringify(lociGrid({ ...lociPose(state, 3), happy: false, squash: 0, sway: 0 })));
    }
  });
});

describe('lociGrid', () => {
  const grid = lociGrid(REST);

  it('is 75 rows by 64 columns', () => {
    expect(LOCI_COLS).toBe(64);
    expect(lociRows()).toBe(75);
    expect(grid).toHaveLength(75);
    for (const row of grid) expect(row).toHaveLength(64);
  });

  it('covers the centre and leaves the corners empty', () => {
    expect(grid[Math.round(143 * SCALE)][Math.round(125 * SCALE)]).not.toBe(CELL_EMPTY);
    for (const [y, x] of [[0, 0], [0, 63], [74, 0], [74, 63]]) expect(grid[y][x]).toBe(CELL_EMPTY);
  });

  it('draws exactly two eye blocks of about 5 x 9 cells at rest', () => {
    const eyes = blocks(grid, CELL_EYE);
    expect(eyes).toHaveLength(2);
    for (const eye of eyes) {
      expect(eye.w).toBe(Math.round(17 * SCALE));
      expect(eye.h).toBe(Math.round(32 * SCALE));
      expect(eye.cells).toBe(eye.w * eye.h - 4); // rounded corners
    }
  });

  it('squashes the eyes to one cell tall at the blink', () => {
    const eyes = blocks(lociGrid({ ...REST, blink: 0.12 }), CELL_EYE);
    expect(eyes).toHaveLength(2);
    for (const eye of eyes) {
      expect(eye.h).toBe(1);
      expect(eye.cells).toBe(eye.w); // no rounded corners on a flat eye
    }
  });

  it('shades the upper left light and the lower right dark, with no other values', () => {
    const values = new Set<LociCell>(grid.flat());
    expect([...values].sort()).toEqual([CELL_EMPTY, CELL_BASE, CELL_LIGHT, CELL_SHADE, CELL_EYE].sort());
    const lit = cellsOf(grid, CELL_LIGHT);
    const dark = cellsOf(grid, CELL_SHADE);
    const mean = (pts: [number, number][], i: 0 | 1) => pts.reduce((s, p) => s + p[i], 0) / pts.length;
    expect(mean(lit, 0)).toBeLessThan(mean(dark, 0));
    expect(mean(lit, 1)).toBeLessThan(mean(dark, 1));
    expect(count(grid, CELL_BASE)).toBeGreaterThan(count(grid, CELL_LIGHT));
  });

  it('snaps the float to whole cells', () => {
    const cell = 1 / SCALE; // one cell in view units
    const a = lociGrid({ ...REST, float: 2 }); // 2 * 64/240 = 0.53 cells -> 1 cell
    expect(a).toBe(lociGrid({ ...REST, float: cell }));
    expect(a).toBe(lociGrid({ ...REST, float: 2.2 }));
    expect(lociGrid({ ...REST, float: 1 })).toBe(lociGrid(REST)); // 0.27 cells -> 0
  });

  it('snaps the tilt to 3.5 degree steps', () => {
    expect(lociGrid({ ...REST, tilt: -7 })).toBe(lociGrid({ ...REST, tilt: -6.5 }));
    expect(lociGrid({ ...REST, tilt: 0 })).toBe(lociGrid({ ...REST, tilt: 1.5 }));
    expect(lociGrid({ ...REST, tilt: 0 })).not.toBe(lociGrid({ ...REST, tilt: 2 }));
  });

  it('moves the body one row down when the float moves one cell', () => {
    const down = lociGrid({ ...REST, float: 1 / SCALE });
    const firstBody = (g: Grid) => g.findIndex((row) => row.some((c) => c !== CELL_EMPTY));
    expect(firstBody(down)).toBe(firstBody(grid) + 1);
  });

  it('returns the identical grid for identical poses and for poses that quantize alike', () => {
    expect(lociGrid({ ...REST })).toBe(lociGrid({ ...REST }));
    expect(lociGrid({ ...REST, eyes: [0.1, 0.1] })).toBe(lociGrid(REST));
  });

  it('listening at full tilt differs from rest', () => {
    const tilted = lociGrid({ float: 0, blink: 1, tilt: -7, eyes: [-7, -2] });
    expect(tilted).not.toBe(grid);
    expect(JSON.stringify(tilted)).not.toBe(JSON.stringify(grid));
  });

  it('supports another density', () => {
    const small = lociGrid(REST, 32);
    expect(small).toHaveLength(lociRows(32));
    expect(lociRows(32)).toBe(Math.round(280 * (32 / 240)));
    expect(small[0]).toHaveLength(32);
  });
});

describe('lociPaths', () => {
  const grid = lociGrid(REST);
  const paths = lociPaths(grid);

  it('makes one path per painted cell value and none for empty cells', () => {
    expect(Object.keys(paths).sort()).toEqual([CELL_BASE, CELL_LIGHT, CELL_SHADE, CELL_EYE].map(String).sort());
  });

  it('contains only rect run segments', () => {
    for (const d of Object.values(paths)) expect(d).toMatch(/^(M\d+ \d+h\d+v1h-\d+z)+$/);
  });

  it('covers exactly the cells of each value', () => {
    for (const [value, d] of Object.entries(paths)) {
      let area = 0;
      for (const m of d.matchAll(/h(\d+)v1/g)) area += Number(m[1]);
      expect(area).toBe(count(grid, Number(value) as LociCell));
    }
  });
});
