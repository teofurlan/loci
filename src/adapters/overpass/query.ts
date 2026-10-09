import type { LatLng } from '../../domain/types';

const FEATURE_FILTERS = [
  '["leisure"~"^(park|garden)$"]',
  '["natural"="water"]',
  '["historic"]',
  '["tourism"~"^(artwork|viewpoint|attraction)$"]',
  '["amenity"~"^(place_of_worship|fountain|library)$"]',
  '["place"="square"]',
];

/**
 * Overpass QL for named, memorable features around a point.
 * `nw` matches nodes and ways; `out center` gives ways a coordinate.
 */
export function buildLandmarkQuery(
  center: LatLng,
  radiusMeters: number,
  timeoutSeconds = 25,
): string {
  if (!(radiusMeters > 0)) throw new Error('radiusMeters must be positive');
  const around = `(around:${radiusMeters},${center.lat},${center.lng})`;
  const statements = FEATURE_FILTERS.map((f) => `  nw${f}["name"]${around};`);
  return `[out:json][timeout:${timeoutSeconds}];\n(\n${statements.join('\n')}\n);\nout center;`;
}
