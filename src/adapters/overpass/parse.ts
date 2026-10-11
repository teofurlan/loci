import type { Landmark, LandmarkKind } from '../../domain/types';

type Tags = Record<string, string>;

type OverpassElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Tags;
};

function kindFromTags(tags: Tags): LandmarkKind {
  if (tags.place === 'square') return 'square';
  if (tags.amenity === 'fountain') return 'fountain';
  if (tags.amenity === 'place_of_worship') return 'worship';
  if (tags.amenity === 'library') return 'library';
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
  if (tags.natural === 'water') return 'water';
  if (tags.tourism === 'viewpoint') return 'viewpoint';
  if (tags.tourism === 'artwork' && tags.artwork_type !== 'statue') return 'artwork';
  if (tags.tourism === 'museum') return 'museum';
  if (tags.amenity === 'theatre' || tags.amenity === 'cinema') return 'theatre';
  if (tags.leisure === 'playground') return 'playground';
  if (tags.leisure === 'stadium' || tags.leisure === 'sports_centre' || tags.leisure === 'pitch') return 'stadium';
  if (tags.memorial === 'statue' || tags.artwork_type === 'statue' || tags.historic === 'memorial') return 'statue';
  if (tags.man_made === 'tower' || tags.man_made === 'lighthouse') return 'tower';
  if (tags.railway === 'station' || tags.public_transport === 'station') return 'station';
  if (tags.amenity === 'marketplace') return 'market';
  if (tags.historic) return 'monument';
  return 'other';
}

function coordinates(el: OverpassElement): { lat: number; lng: number } | undefined {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  return typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : undefined;
}

/** Overpass JSON -> landmarks. Drops unnamed or coordinate-less elements and dedupes by id. */
export function parseOverpassResponse(json: unknown): Landmark[] {
  const elements = (json as { elements?: unknown } | null)?.elements;
  if (!Array.isArray(elements)) return [];

  const seen = new Set<string>();
  const landmarks: Landmark[] = [];
  for (const el of elements as OverpassElement[]) {
    const name = el.tags?.name?.trim();
    const position = coordinates(el);
    if (!name || !position || !el.type || el.id === undefined) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    landmarks.push({ id, name, kind: kindFromTags(el.tags ?? {}), position });
  }
  return landmarks;
}
