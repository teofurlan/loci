import fixture from './__fixtures__/buenos-aires.json';
import { parseOverpassResponse } from './parse';

describe('parseOverpassResponse', () => {
  const landmarks = parseOverpassResponse(fixture);
  const byId = new Map(landmarks.map((l) => [l.id, l]));

  it('uses lat/lon for nodes and center for ways', () => {
    expect(byId.get('node/111')?.position).toEqual({ lat: -34.6037, lng: -58.3816 });
    expect(byId.get('way/221')?.position).toEqual({ lat: -34.61, lng: -58.37 });
  });

  it('drops unnamed elements and ways without a center', () => {
    expect(byId.has('node/113')).toBe(false);
    expect(byId.has('way/224')).toBe(false);
  });

  it('dedupes by id, keeping the first occurrence', () => {
    expect(landmarks.filter((l) => l.id === 'node/112')).toHaveLength(1);
    expect(byId.get('node/112')?.kind).toBe('monument');
  });

  it('maps tags to landmark kinds', () => {
    const kind = (id: string) => byId.get(id)?.kind;
    expect(kind('node/111')).toBe('square');
    expect(kind('node/114')).toBe('fountain');
    expect(kind('way/221')).toBe('park');
    expect(kind('way/222')).toBe('water');
    expect(kind('way/223')).toBe('worship');
    expect(kind('node/115')).toBe('viewpoint');
    expect(kind('node/116')).toBe('library');
    expect(kind('node/117')).toBe('artwork');
    expect(kind('node/118')).toBe('monument');
    expect(kind('node/119')).toBe('other');
  });

  it('returns an empty list for malformed payloads', () => {
    expect(parseOverpassResponse(null)).toEqual([]);
    expect(parseOverpassResponse({})).toEqual([]);
    expect(parseOverpassResponse({ elements: 'x' })).toEqual([]);
  });
});
