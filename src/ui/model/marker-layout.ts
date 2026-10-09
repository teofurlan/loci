/** Pure map geometry for framing the course and keeping marker plates from overlapping. */

export type LatLngLike = { lat: number; lng: number };
export type Bounds = { west: number; south: number; east: number; north: number };
export type Viewport = { width: number; height: number };
export type Padding = { top: number; right: number; bottom: number; left: number };

/** MapLibre uses 512 px tiles: the world is 512 px wide at zoom 0. */
const WORLD = 512;
const MAX_ZOOM = 18;

/** Web Mercator pixel position at a zoom level, origin at the top-left of the world. */
export function projectPx({ lat, lng }: LatLngLike, zoom: number): { x: number; y: number } {
  const size = WORLD * 2 ** zoom;
  const sin = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

/** The zoom at which `bounds` fills the padded viewport, never past street level. */
export function fitZoom(bounds: Bounds, viewport: Viewport, padding: Padding): number {
  const sw = projectPx({ lat: bounds.south, lng: bounds.west }, 0);
  const ne = projectPx({ lat: bounds.north, lng: bounds.east }, 0);
  const dx = Math.abs(ne.x - sw.x);
  const dy = Math.abs(sw.y - ne.y);
  const availW = Math.max(1, viewport.width - padding.left - padding.right);
  const availH = Math.max(1, viewport.height - padding.top - padding.bottom);
  const zx = dx > 0 ? Math.log2(availW / dx) : MAX_ZOOM;
  const zy = dy > 0 ? Math.log2(availH / dy) : MAX_ZOOM;
  return Math.max(0, Math.min(MAX_ZOOM, zx, zy));
}

/**
 * Pixel offsets that push overlapping markers apart until each pair is at least `minDistance` apart.
 * Deterministic: exact overlaps split along a fixed angle per index.
 */
export function separateMarkers(
  points: readonly { x: number; y: number }[],
  minDistance: number,
): { dx: number; dy: number }[] {
  const offsets = points.map(() => ({ dx: 0, dy: 0 }));
  for (let pass = 0; pass < 60; pass += 1) {
    let moved = false;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        let vx = points[j].x + offsets[j].dx - (points[i].x + offsets[i].dx);
        let vy = points[j].y + offsets[j].dy - (points[i].y + offsets[i].dy);
        let d = Math.hypot(vx, vy);
        if (d >= minDistance) continue;
        if (d < 0.01) {
          const angle = ((i + j * 2) * 2.399963) % (2 * Math.PI);
          vx = Math.cos(angle);
          vy = Math.sin(angle);
          d = 1;
        }
        const push = (minDistance - d) / 2 + 0.01;
        const ux = vx / d;
        const uy = vy / d;
        offsets[i].dx -= ux * push;
        offsets[i].dy -= uy * push;
        offsets[j].dx += ux * push;
        offsets[j].dy += uy * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return offsets;
}
