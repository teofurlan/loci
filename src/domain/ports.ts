import type { Landmark, LatLng } from './types';

export interface LandmarkSource {
  findNear(center: LatLng, radiusMeters: number): Promise<Landmark[]>;
}
