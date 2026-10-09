import { offsetMeters } from './geo';
import type { LatLng, Rng } from './types';

export type LoopParams = {
  origin: LatLng;
  targetDistanceMeters: number;
  count: number;
  rng: Rng;
};

const RADIUS_JITTER = 0.15;
const ANGLE_JITTER_FRACTION = 0.25;

/**
 * Places `count` candidate points on a circle of circumference ~ target distance,
 * with the origin on the circle, a random rotation and bounded jitter.
 * Walking origin -> points in order -> origin approximates the target distance.
 */
export function generateLoopCandidates({
  origin,
  targetDistanceMeters,
  count,
  rng,
}: LoopParams): LatLng[] {
  if (!Number.isInteger(count) || count < 1) throw new Error('count must be a positive integer');
  if (!(targetDistanceMeters > 0)) throw new Error('targetDistanceMeters must be positive');

  const radius = targetDistanceMeters / (2 * Math.PI);
  const rotation = rng() * 2 * Math.PI;
  const step = (2 * Math.PI) / (count + 1);

  // The circle center lies `radius` away from the origin, at the rotation bearing.
  const centerNorth = radius * Math.cos(rotation);
  const centerEast = radius * Math.sin(rotation);
  // Angle (bearing from center) at which the origin sits on the circle.
  const originAngle = rotation + Math.PI;

  const points: LatLng[] = [];
  for (let i = 1; i <= count; i++) {
    const angleJitter = (rng() * 2 - 1) * step * ANGLE_JITTER_FRACTION;
    const radiusScale = 1 + (rng() * 2 - 1) * RADIUS_JITTER;
    const angle = originAngle + step * i + angleJitter;
    const r = radius * radiusScale;
    points.push(offsetMeters(origin, centerNorth + r * Math.cos(angle), centerEast + r * Math.sin(angle)));
  }
  return points;
}
