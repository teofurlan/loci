import { fitZoom, projectPx, separateMarkers } from './marker-layout';

describe('projectPx', () => {
  it('puts the equator and prime meridian at the world center', () => {
    const p = projectPx({ lat: 0, lng: 0 }, 0);
    expect(p.x).toBeCloseTo(256, 3);
    expect(p.y).toBeCloseTo(256, 3);
  });

  it('doubles the world size with every zoom level', () => {
    const a = projectPx({ lat: 10, lng: 20 }, 3);
    const b = projectPx({ lat: 10, lng: 20 }, 4);
    expect(b.x).toBeCloseTo(a.x * 2, 3);
    expect(b.y).toBeCloseTo(a.y * 2, 3);
  });

  it('puts north above south', () => {
    expect(projectPx({ lat: 10, lng: 0 }, 5).y).toBeLessThan(projectPx({ lat: -10, lng: 0 }, 5).y);
  });
});

describe('fitZoom', () => {
  const bounds = { west: -60.466, south: -32.07, east: -60.462, north: -32.066 };
  const pad = { top: 10, right: 10, bottom: 10, left: 10 };

  it('frames the bounds inside the padded viewport', () => {
    const z = fitZoom(bounds, { width: 400, height: 400 }, pad);
    const sw = projectPx({ lat: bounds.south, lng: bounds.west }, z);
    const ne = projectPx({ lat: bounds.north, lng: bounds.east }, z);
    expect(Math.abs(ne.x - sw.x)).toBeLessThanOrEqual(380 + 0.5);
    expect(Math.abs(ne.y - sw.y)).toBeLessThanOrEqual(380 + 0.5);
  });

  it('zooms in further for a smaller area', () => {
    const big = fitZoom(bounds, { width: 400, height: 400 }, pad);
    const small = fitZoom(
      { west: -60.4641, south: -32.0681, east: -60.4639, north: -32.0679 },
      { width: 400, height: 400 },
      pad,
    );
    expect(small).toBeGreaterThan(big);
  });

  it('never zooms past street level', () => {
    expect(fitZoom({ west: 1, south: 1, east: 1, north: 1 }, { width: 400, height: 400 }, pad)).toBeLessThanOrEqual(18);
  });
});

describe('separateMarkers', () => {
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

  it('leaves markers that are already apart alone', () => {
    const out = separateMarkers(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      40,
    );
    expect(out).toEqual([
      { dx: 0, dy: 0 },
      { dx: 0, dy: 0 },
    ]);
  });

  it('pushes overlapping markers apart to the minimum distance', () => {
    const pts = [
      { x: 50, y: 50 },
      { x: 55, y: 52 },
      { x: 48, y: 47 },
    ];
    const out = separateMarkers(pts, 40);
    const moved = pts.map((p, i) => ({ x: p.x + out[i].dx, y: p.y + out[i].dy }));
    for (let i = 0; i < moved.length; i++) {
      for (let j = i + 1; j < moved.length; j++) expect(dist(moved[i], moved[j])).toBeGreaterThanOrEqual(39);
    }
  });

  it('separates markers that sit exactly on top of each other', () => {
    const out = separateMarkers(
      [
        { x: 10, y: 10 },
        { x: 10, y: 10 },
      ],
      40,
    );
    expect(out[0]).not.toEqual(out[1]);
  });

  it('is deterministic', () => {
    const pts = [
      { x: 1, y: 1 },
      { x: 3, y: 2 },
    ];
    expect(separateMarkers(pts, 40)).toEqual(separateMarkers(pts, 40));
  });
});
