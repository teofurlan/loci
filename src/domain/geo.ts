import type { LatLng } from './types';

export const EARTH_RADIUS_METERS = 6_371_008.8;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Offsets a point by meters north/east using a local flat-earth approximation. */
export function offsetMeters(from: LatLng, northMeters: number, eastMeters: number): LatLng {
  const dLat = northMeters / EARTH_RADIUS_METERS;
  const dLng = eastMeters / (EARTH_RADIUS_METERS * Math.cos(toRad(from.lat)));
  return { lat: from.lat + (dLat * 180) / Math.PI, lng: from.lng + (dLng * 180) / Math.PI };
}

/** Initial great-circle bearing from `from` to `to`, in degrees clockwise from north, in [0, 360). */
export function bearingDegrees(from: LatLng, to: LatLng): number {
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360) % 360;
}

export type CompassPoint = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

const COMPASS_POINTS: readonly CompassPoint[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Coarse 8-point compass label for a bearing in degrees. */
export function compassLabel(bearing: number): CompassPoint {
  const index = Math.round((((bearing % 360) + 360) % 360) / 45) % 8;
  return COMPASS_POINTS[index];
}
