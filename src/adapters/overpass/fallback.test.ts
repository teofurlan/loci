import type { LandmarkSource } from '../../domain/ports';
import type { Landmark } from '../../domain/types';
import { FallbackLandmarkSource } from './fallback';
import { OverpassHttpError } from './source';

const center = { lat: -34.6, lng: -58.4 };
const landmark: Landmark = { id: 'n1', name: 'Obelisco', kind: 'monument', position: center } as Landmark;

const ok = (found: Landmark[]): LandmarkSource => ({ findNear: jest.fn(async () => found) });
const failing = (error: Error): LandmarkSource => ({ findNear: jest.fn(async () => Promise.reject(error)) });

describe('FallbackLandmarkSource', () => {
  it('returns the first source answer without touching the others', async () => {
    const second = ok([]);
    const source = new FallbackLandmarkSource([ok([landmark]), second]);
    await expect(source.findNear(center, 800)).resolves.toEqual([landmark]);
    expect(second.findNear).not.toHaveBeenCalled();
  });

  it('moves on to the next source when one fails', async () => {
    const source = new FallbackLandmarkSource([failing(new OverpassHttpError(504)), ok([landmark])]);
    await expect(source.findNear(center, 800)).resolves.toEqual([landmark]);
  });

  it('rethrows the first error when every source fails', async () => {
    const first = new OverpassHttpError(429);
    const source = new FallbackLandmarkSource([failing(first), failing(new OverpassHttpError(500))]);
    await expect(source.findNear(center, 800)).rejects.toBe(first);
  });

  it('requires at least one source', () => {
    expect(() => new FallbackLandmarkSource([])).toThrow();
  });
});
