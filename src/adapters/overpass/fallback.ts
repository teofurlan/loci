import type { LandmarkSource } from '../../domain/ports';
import type { Landmark, LatLng } from '../../domain/types';

/**
 * Asks each source in order and returns the first answer. The public Overpass servers are
 * often overloaded, so a mirror gets a chance before the user sees an error. When every
 * source fails, the first error is rethrown because it comes from the preferred server.
 */
export class FallbackLandmarkSource implements LandmarkSource {
  constructor(private readonly sources: readonly LandmarkSource[]) {
    if (sources.length === 0) throw new Error('FallbackLandmarkSource needs at least one source');
  }

  async findNear(center: LatLng, radiusMeters: number): Promise<Landmark[]> {
    let firstError: unknown;
    let failed = false;
    for (const source of this.sources) {
      try {
        return await source.findNear(center, radiusMeters);
      } catch (error) {
        if (!failed) {
          failed = true;
          firstError = error;
        }
      }
    }
    throw firstError;
  }
}
