import type { LandmarkKind } from '../../domain/types';
import { PICTOGRAMS, pictogramFor } from './pictograms';

const KINDS: LandmarkKind[] = [
  'park',
  'water',
  'monument',
  'artwork',
  'worship',
  'fountain',
  'viewpoint',
  'library',
  'square',
  'other',
];

describe('pictograms', () => {
  it.each(KINDS)('draws %s with at least one stroke on the 24 grid', (kind) => {
    const strokes = pictogramFor(kind);
    expect(strokes.length).toBeGreaterThan(0);
    strokes.forEach((d) => expect(d).toMatch(/^M[\d .,MLCAZHVQSTmlcazhvqst-]+$/));
  });

  it('covers every landmark kind and nothing else', () => {
    expect(Object.keys(PICTOGRAMS).sort()).toEqual([...KINDS].sort());
  });

  it('gives each kind its own drawing', () => {
    const drawings = KINDS.map((kind) => pictogramFor(kind).join('|'));
    expect(new Set(drawings).size).toBe(KINDS.length);
  });
});
