/**
 * Loci, the companion: a soft violet blob with two pill eyes, drawn as a 64-cell-wide pixel grid.
 * Pure model (no React Native): pose sampling from keyframe tracks, a rasterizer, and run-length path data.
 * Reproduces the approved motion study (`loci-pixel-motion-study-v2`): 12 fps, offsets snapped to whole cells,
 * tilt snapped to 3.5 degree steps, corner light shading, no rim. The `celebrate` state follows the approved
 * celebrate study: a small happy dance at 72 bpm with closed, smiling chevron eyes.
 */

export type LociState = 'waiting' | 'listening' | 'hint' | 'celebrate';

/** Loci's pose in view units (the 240 x 280 drawing space) and degrees. */
export type LociPose = {
  /** Vertical float offset of the whole body, view units (positive is down). */
  float: number;
  /** Eye height factor: 1 is open, 0.12 is the blink. */
  blink: number;
  /** Body tilt in degrees about the body centre. */
  tilt: number;
  /** Eye offset from their rest position, view units: [x, y]. */
  eyes: readonly [number, number];
  /** Celebrate only: horizontal offset of the whole body, view units (positive is right). Absent means 0. */
  sway?: number;
  /** Celebrate only: how much the body is squashed down toward its foot, 0 to 1. Absent means 0. */
  squash?: number;
  /** Celebrate only: closed, smiling chevron eyes instead of pills. */
  happy?: boolean;
};

export type LociPoseOptions = {
  /** Waiting only: hold the glance toward the input instead of cycling. */
  attentive?: boolean;
  /** Static poses: no float, no blink, no cycling. */
  reducedMotion?: boolean;
};

/**
 * Cell encoding of a grid: small integers so a grid is cheap to compare and to turn into paths.
 *   0 empty   1 body base   2 body light (upper-left edge)   3 body shade (lower-right edge)   4 eye
 */
export const CELL_EMPTY = 0;
export const CELL_BASE = 1;
export const CELL_LIGHT = 2;
export const CELL_SHADE = 3;
export const CELL_EYE = 4;
export type LociCell = 0 | 1 | 2 | 3 | 4;
export type LociGrid = readonly (readonly LociCell[])[];
/** The painted cell values, i.e. everything but empty. */
export type LociPaint = 1 | 2 | 3 | 4;

export const LOCI_COLS = 64;
export const LOCI_FPS = 12;

const VIEW_W = 240;
const VIEW_H = 280;
const TILT_STEP = 3.5;
const BODY_CENTER = { x: 125, y: 143 } as const;
const EYES = [
  { x: 75, y: 95, w: 17, h: 32 },
  { x: 123, y: 95, w: 17, h: 32 },
] as const;
const EYES_CENTER_Y = 111;
/** Squash anchor: the bottom of the body stays on the ground. */
const FOOT = { x: 125, y: 255 } as const;
const BODY_TOP = 27;
/** The squash widens the body by this share of what it loses in height. */
const SQUASH_WIDEN = 0.7;
/** Closed, smiling eyes as a bitmap (X is eye colour), drawn in the upper half of the open eye. */
const HAPPY_EYE = ['..XX..', '.XXXX.', 'XX..XX', 'X....X'] as const;
const HAPPY_EYE_RISE = 7;

const CELEBRATE = { bpm: 72, sway: 8, tilt: 3.5, rise: 9, squash: 0.07 } as const;

type Keys<T> = readonly (readonly [number, T])[];
type Track<T> = { dur: number; keys: Keys<T> };
type Vec2 = readonly [number, number];

const FLOAT: Track<number> = {
  dur: 5.6,
  keys: [[0, 5], [50, -5], [100, 5]],
};
const BLINK: Track<number> = {
  dur: 8.5,
  keys: [[0, 1], [42, 1], [43, 0.12], [44, 1], [100, 1]],
};

const GLANCE: Vec2 = [1, 4];

/** States that cycle through keyframe tracks; celebrate is computed from its beat instead. */
type TrackedState = Exclude<LociState, 'celebrate'>;

const TRACKS: Record<TrackedState, { tilt?: Track<number>; eyes: Track<Vec2> }> = {
  waiting: {
    eyes: { dur: 10, keys: [[0, [0, 0]], [20, [0, 0]], [32, GLANCE], [60, GLANCE], [75, [0, 0]], [100, [0, 0]]] },
  },
  listening: {
    tilt: { dur: 7, keys: [[0, 0], [15, 0], [35, -7], [65, -7], [90, 0], [100, 0]] },
    eyes: { dur: 7, keys: [[0, [0, 0]], [15, [0, 0]], [35, [-7, -2]], [65, [-7, -2]], [90, [0, 0]], [100, [0, 0]]] },
  },
  hint: {
    tilt: { dur: 8, keys: [[0, 0], [18, 0], [38, 5], [62, 5], [85, 0], [100, 0]] },
    eyes: { dur: 8, keys: [[0, [0, 0]], [18, [0, 0]], [38, [8, 0]], [62, [8, 0]], [85, [0, 0]], [100, [0, 0]]] },
  },
};

/** The poses held when motion is reduced. */
const STILL: Record<TrackedState, { tilt: number; eyes: Vec2 }> = {
  waiting: { tilt: 0, eyes: [0, 0] },
  listening: { tilt: -7, eyes: [-7, -2] },
  hint: { tilt: 5, eyes: [8, 0] },
};

/** CSS-style ease-in-out (cubic). */
const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function mix<T extends number | Vec2>(a: T, b: T, t: number): T {
  if (typeof a === 'number') return (a + ((b as number) - a) * t) as T;
  const [ax, ay] = a as Vec2;
  const [bx, by] = b as Vec2;
  return [ax + (bx - ax) * t, ay + (by - ay) * t] as unknown as T;
}

function sample<T extends number | Vec2>(track: Track<T>, seconds: number): T {
  const p = (((seconds % track.dur) + track.dur) % track.dur / track.dur) * 100;
  const k = track.keys;
  for (let i = 0; i < k.length - 1; i += 1) {
    if (p >= k[i][0] && p <= k[i + 1][0]) {
      const span = k[i + 1][0] - k[i][0] || 1;
      return mix(k[i][1], k[i + 1][1], ease((p - k[i][0]) / span));
    }
  }
  return k[k.length - 1][1];
}

/** Which 12 fps frame a time in seconds falls in. */
export const frameAt = (seconds: number): number => Math.floor(seconds * LOCI_FPS + 1e-9);
/** The time in seconds a frame is sampled at. */
export const frameSeconds = (frame: number): number => frame / LOCI_FPS;

/** Celebrate: sway over two beats, a rise at each end of the swing, a dip with a squash in the middle. */
function celebratePose(seconds: number): LociPose {
  const beat = 60 / CELEBRATE.bpm;
  const swing = Math.sin((seconds / (2 * beat)) * 2 * Math.PI - Math.PI / 2); // -1..1, an end of the swing on each beat
  const up = (Math.cos((seconds / beat) * 2 * Math.PI) + 1) / 2; // 1 at the ends of the swing, 0 in the middle
  return {
    float: -CELEBRATE.rise * up,
    blink: 1,
    tilt: CELEBRATE.tilt * swing,
    eyes: [0, 0],
    sway: CELEBRATE.sway * swing,
    squash: CELEBRATE.squash * (1 - up),
    happy: true,
  };
}

/** Loci's pose at a time, sampled from the keyframe tracks of its state. */
export function lociPose(state: LociState, seconds: number, opts: LociPoseOptions = {}): LociPose {
  if (state === 'celebrate') {
    if (opts.reducedMotion) return { float: 0, blink: 1, tilt: 0, eyes: [0, 0], sway: 0, squash: 0, happy: true };
    return celebratePose(seconds);
  }
  const attentive = opts.attentive === true && state === 'waiting';
  if (opts.reducedMotion) {
    const still = STILL[state];
    return { float: 0, blink: 1, tilt: still.tilt, eyes: attentive ? GLANCE : still.eyes };
  }
  const tracks = TRACKS[state];
  return {
    float: sample(FLOAT, seconds),
    blink: sample(BLINK, seconds),
    tilt: tracks.tilt ? sample(tracks.tilt, seconds) : 0,
    eyes: attentive ? GLANCE : sample(tracks.eyes, seconds),
  };
}

// --- Rasterizer -----------------------------------------------------------------------------------------------

/** Cubic Bezier segments of the body outline (viewBox 240 x 280), after the start point M120 27. */
const BODY_START: Vec2 = [120, 27];
const BODY_SEGMENTS: readonly (readonly number[])[] = [
  [166, 24, 204, 52, 217, 94],
  [228, 131, 218, 163, 203, 190],
  [189, 214, 192, 238, 174, 251],
  [157, 263, 134, 252, 113, 241],
  [79, 225, 51, 201, 37, 170],
  [20, 134, 22, 94, 42, 63],
  [59, 39, 88, 27, 120, 27],
];
const FLATTEN_STEPS = 32;

/** The outline flattened into a polygon, fine enough that cell-centre tests match the vector shape. */
const BODY_POLYGON: readonly Vec2[] = (() => {
  const pts: Vec2[] = [BODY_START];
  let [px, py] = BODY_START;
  for (const [c1x, c1y, c2x, c2y, x, y] of BODY_SEGMENTS) {
    for (let i = 1; i <= FLATTEN_STEPS; i += 1) {
      const t = i / FLATTEN_STEPS;
      const u = 1 - t;
      pts.push([
        u * u * u * px + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
        u * u * u * py + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
      ]);
    }
    [px, py] = [x, y];
  }
  return pts;
})();

/** Rows of a grid that is `cols` wide: the 240 x 280 view scaled by cols / 240. */
export const lociRows = (cols: number = LOCI_COLS): number => Math.round(VIEW_H * (cols / VIEW_W));

/** Rotates a point about the body centre. */
function rotate(x: number, y: number, deg: number): Vec2 {
  const r = (deg * Math.PI) / 180;
  const dx = x - BODY_CENTER.x;
  const dy = y - BODY_CENTER.y;
  return [BODY_CENTER.x + dx * Math.cos(r) - dy * Math.sin(r), BODY_CENTER.y + dx * Math.sin(r) + dy * Math.cos(r)];
}

/** Where a point of the drawing lands: rotate about the body centre, squash about the foot, then move. */
type Place = (x: number, y: number) => Vec2;

function placement(tilt: number, scaleX: number, scaleY: number, dx: number, dy: number): Place {
  const squashed = scaleX !== 1 || scaleY !== 1;
  return (x, y) => {
    const [rx, ry] = rotate(x, y, tilt);
    if (!squashed) return [rx + dx, ry + dy];
    return [FOOT.x + (rx - FOOT.x) * scaleX + dx, FOOT.y + (ry - FOOT.y) * scaleY + dy];
  };
}

/** Marks the cells whose centre lies inside the body, which is sampling coverage at 50%. */
function bodyMask(cols: number, rows: number, scale: number, place: Place): boolean[][] {
  // Move the polygon into grid space once, then scan each row at its cell-centre height.
  const poly = BODY_POLYGON.map(([x, y]) => {
    const [px, py] = place(x, y);
    return [px * scale, py * scale] as const;
  });
  const mask = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
  for (let y = 0; y < rows; y += 1) {
    const cy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0; i < poly.length; i += 1) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      if (y1 > cy !== y2 > cy) xs.push(x1 + ((cy - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const from = Math.max(0, Math.ceil(xs[i] - 0.5));
      const to = Math.min(cols - 1, Math.ceil(xs[i + 1] - 0.5) - 1);
      for (let x = from; x <= to; x += 1) mask[y][x] = true;
    }
  }
  return mask;
}

const MEMO_LIMIT = 256;
const memo = new Map<string, LociGrid>();

/** Rows between the top of the body and its foot at a density. */
const bodyRowsAt = (scale: number): number => (FOOT.y - BODY_TOP) * scale;

/** Quantized values of a pose: what actually changes pixels, and so the memo key. */
function quantize(pose: LociPose, scale: number) {
  const cell = (v: number) => Math.round(v * scale) + 0; // + 0 folds -0 into 0
  return {
    floatCells: cell(pose.float),
    eyeXCells: cell(pose.eyes[0]),
    eyeYCells: cell(pose.eyes[1]),
    tiltSteps: Math.round(pose.tilt / TILT_STEP) + 0,
    eyeHeight: Math.max(1, Math.round(EYES[0].h * pose.blink * scale)),
    swayCells: cell(pose.sway ?? 0),
    // Rows the squash takes off the body, whole rows only: it stays 0 until it is worth a full row.
    squashRows: Math.round((pose.squash ?? 0) * bodyRowsAt(scale)) + 0,
    happy: pose.happy === true,
  };
}

/**
 * Rasterizes a pose into a rows x cols grid of cell values (see `CELL_*`). Float, sway and eye offsets snap to whole
 * cells, the squash to whole rows and tilt to 3.5 degree steps, so a held pose is a constant grid. Results are memoized by the quantized
 * pose, so asking for the same pose again returns the very same grid object.
 */
export function lociGrid(pose: LociPose, cols: number = LOCI_COLS): LociGrid {
  const scale = cols / VIEW_W;
  const q = quantize(pose, scale);
  const key = `${cols}|${q.floatCells}|${q.eyeXCells}|${q.eyeYCells}|${q.tiltSteps}|${q.eyeHeight}|${q.swayCells}|${q.squashRows}|${q.happy ? 1 : 0}`;
  const hit = memo.get(key);
  if (hit) return hit;

  const rows = lociRows(cols);
  const floatY = q.floatCells / scale;
  const eyeX = q.eyeXCells / scale;
  const eyeY = q.eyeYCells / scale;
  const swayX = q.swayCells / scale;
  const tilt = q.tiltSteps * TILT_STEP;
  const scaleY = 1 - q.squashRows / bodyRowsAt(scale);
  const scaleX = 1 + (1 - scaleY) * SQUASH_WIDEN;
  const place = placement(tilt, scaleX, scaleY, swayX, floatY);
  const mask = bodyMask(cols, rows, scale, place);
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && mask[y][x];

  // Corner light: from the upper left, one band of highlight and a wider band of shade.
  const band = Math.max(1, Math.round(cols / 22));
  const grid: LociCell[][] = Array.from({ length: rows }, () => new Array<LociCell>(cols).fill(CELL_EMPTY));
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!mask[y][x]) continue;
      if (!inside(x + band + 1, y + band + 1)) grid[y][x] = CELL_SHADE;
      else if (!inside(x - band, y - band)) grid[y][x] = CELL_LIGHT;
      else grid[y][x] = CELL_BASE;
    }
  }

  // Eyes stay axis-aligned; their centres follow the body's tilt, squash, sway and float.
  for (const e of EYES) {
    if (q.happy) {
      const [cx, cy] = place(e.x + e.w / 2, EYES_CENTER_Y - HAPPY_EYE_RISE);
      const x0 = Math.round(cx * scale - HAPPY_EYE[0].length / 2);
      const y0 = Math.round(cy * scale - HAPPY_EYE.length / 2);
      HAPPY_EYE.forEach((bits, y) => {
        for (let x = 0; x < bits.length; x += 1) {
          const gx = x0 + x;
          const gy = y0 + y;
          if (bits[x] === 'X' && gx >= 0 && gy >= 0 && gx < cols && gy < rows) grid[gy][gx] = CELL_EYE;
        }
      });
      continue;
    }
    const [cx, cy] = place(e.x + e.w / 2 + eyeX, EYES_CENTER_Y + eyeY);
    const w = Math.max(1, Math.round(e.w * scale));
    const h = q.eyeHeight;
    const x0 = Math.round(cx * scale - w / 2);
    const y0 = Math.round(cy * scale - h / 2);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const corner = h >= 5 && w >= 4 && (y === 0 || y === h - 1) && (x === 0 || x === w - 1);
        const gx = x0 + x;
        const gy = y0 + y;
        if (!corner && gx >= 0 && gy >= 0 && gx < cols && gy < rows) grid[gy][gx] = CELL_EYE;
      }
    }
  }

  if (memo.size >= MEMO_LIMIT) memo.clear();
  memo.set(key, grid);
  return grid;
}

/**
 * Run-length merged SVG path data per painted cell value, like `spritePaths`: one `d` string of crisp rect
 * runs per value, so a grid renders as at most four paths.
 */
export function lociPaths(grid: LociGrid): Partial<Record<LociPaint, string>> {
  const out: Partial<Record<LociPaint, string>> = {};
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const value = row[x];
      if (value === CELL_EMPTY) {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === value) end += 1;
      out[value] = `${out[value] ?? ''}M${x} ${y}h${end - x}v1h-${end - x}z`;
      x = end;
    }
  });
  return out;
}
