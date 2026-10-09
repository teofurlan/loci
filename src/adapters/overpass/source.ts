import type { LandmarkSource } from '../../domain/ports';
import type { Landmark, LatLng } from '../../domain/types';
import { parseOverpassResponse } from './parse';
import { buildLandmarkQuery } from './query';

type FetchFn = (url: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

export type OverpassOptions = {
  fetch: FetchFn;
  endpoint: string;
  /** Overpass asks clients to identify themselves with a User-Agent or Referer. */
  userAgent: string;
  timeoutMs?: number;
};

export const DEFAULT_OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

export class OverpassLandmarkSource implements LandmarkSource {
  private readonly timeoutMs: number;

  constructor(private readonly options: OverpassOptions) {
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  async findNear(center: LatLng, radiusMeters: number): Promise<Landmark[]> {
    const query = buildLandmarkQuery(center, radiusMeters, Math.ceil(this.timeoutMs / 1000));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.options.fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.options.userAgent,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Overpass request failed with status ${response.status}`);
      return parseOverpassResponse(await response.json());
    } finally {
      clearTimeout(timer);
    }
  }
}
