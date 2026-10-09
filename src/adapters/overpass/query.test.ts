import { buildLandmarkQuery } from './query';

describe('buildLandmarkQuery', () => {
  const q = buildLandmarkQuery({ lat: -34.6037, lng: -58.3816 }, 1500, 20);

  it('uses JSON output with a timeout and out center', () => {
    expect(q.startsWith('[out:json][timeout:20];')).toBe(true);
    expect(q.trimEnd().endsWith('out center;')).toBe(true);
  });

  it('filters by around with radius, lat and lon', () => {
    expect(q).toContain('(around:1500,-34.6037,-58.3816)');
  });

  it('requires a name and covers the target tags for nodes and ways', () => {
    for (const filter of [
      '["leisure"~"^(park|garden)$"]',
      '["natural"="water"]',
      '["historic"]',
      '["tourism"~"^(artwork|viewpoint|attraction)$"]',
      '["amenity"~"^(place_of_worship|fountain|library)$"]',
      '["place"="square"]',
    ]) {
      expect(q).toContain(`nw${filter}["name"](around:1500,-34.6037,-58.3816);`);
    }
  });

  it('rejects a non-positive radius', () => {
    expect(() => buildLandmarkQuery({ lat: 0, lng: 0 }, 0)).toThrow();
  });
});
