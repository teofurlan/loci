import type { MapTokens } from '../theme/palettes';

type Props = Record<string, unknown>;
export type LayerLike = { id: string; type: string; paint?: Props; layout?: Props; [key: string]: unknown };
export type StyleLike = { version: number; sources: Record<string, unknown>; glyphs?: string; layers: LayerLike[]; [key: string]: unknown };

/** Road names and settlement names only: everything else would crowd the sprites. */
const KEEP_LABELS = /^(highway-name-major|label_(city|city_capital|town|village))$/;
const GREEN = /park|wood|grass|forest|garden|pitch|golf|recreation/;
const MINOR = /minor|path|service|track|railway|pier/;
const PARK_CLASSES = ['park', 'garden', 'playground', 'pitch', 'golf_course', 'recreation_ground', 'village_green', 'cemetery'];
const LABEL_FONT = ['Noto Sans Bold'];

function paintFill(layer: LayerLike, map: MapTokens): Props {
  if (/building/.test(layer.id)) {
    return { 'fill-color': map.building, 'fill-outline-color': map.building, 'fill-opacity': 1 };
  }
  if (/water/.test(layer.id)) return { 'fill-color': map.water, 'fill-opacity': 1 };
  if (/wood|forest/.test(layer.id)) return { 'fill-color': map.wood, 'fill-opacity': 1 };
  return { 'fill-color': GREEN.test(layer.id) ? map.park : map.land, 'fill-opacity': 1 };
}

function paintLine(layer: LayerLike, map: MapTokens): Props {
  const { id } = layer;
  const keep = { ...layer.paint };
  let color = map.road;
  if (/waterway/.test(id)) color = map.water;
  else if (/boundary/.test(id)) color = map.boundary;
  else if (/casing/.test(id)) color = map.road;
  else if (/inner|dashline|subtle/.test(id)) color = map.roadFill;
  else if (MINOR.test(id)) color = map.roadMinor;
  return { ...keep, 'line-color': color, 'line-opacity': 1 };
}

function paintSymbol(layer: LayerLike, map: MapTokens): LayerLike {
  const { 'icon-image': _icon, ...layout } = layer.layout ?? {};
  return {
    ...layer,
    layout: { ...layout, 'text-font': LABEL_FONT },
    paint: { 'text-color': map.label, 'text-halo-color': map.labelHalo, 'text-halo-width': 1.5, 'text-halo-blur': 0 },
  };
}

/**
 * The base style only draws protected parks and woods, so plazas, gardens and grass would stay land-colored.
 * These fills add them from the landuse and landcover tile layers, right above the ground.
 */
function greenLayers(source: string, map: MapTokens): LayerLike[] {
  const matching = (values: string[]) => ['match', ['get', 'class'], values, true, false];
  return [
    {
      id: 'pixel-landcover-grass',
      type: 'fill',
      source,
      'source-layer': 'landcover',
      filter: matching(['grass']),
      paint: { 'fill-color': map.park, 'fill-opacity': 1 },
    },
    {
      id: 'pixel-landuse-green',
      type: 'fill',
      source,
      'source-layer': 'landuse',
      filter: matching(PARK_CLASSES),
      paint: { 'fill-color': map.park, 'fill-opacity': 1 },
    },
  ];
}

/**
 * Recolors an OpenFreeMap (OpenMapTiles) style into the terrain language: parks and woods green, land pale,
 * water blue, major roads ink, minor roads muted, buildings quiet, sparse ink labels. Pure: the input is not mutated.
 */
export function pixelizeStyle(style: StyleLike, map: MapTokens): StyleLike {
  const source = style.layers.find((l) => typeof l.source === 'string')?.source as string | undefined;
  const layers: LayerLike[] = [];
  for (const layer of style.layers) {
    switch (layer.type) {
      case 'background':
        layers.push({ ...layer, paint: { 'background-color': map.land } });
        layers.push(...greenLayers(source ?? 'openmaptiles', map));
        break;
      case 'fill':
        layers.push({ ...layer, paint: paintFill(layer, map) });
        break;
      case 'line':
        layers.push({ ...layer, paint: paintLine(layer, map) });
        break;
      case 'symbol':
        if (KEEP_LABELS.test(layer.id)) layers.push(paintSymbol(layer, map));
        break;
      default:
        break;
    }
  }
  return { ...style, layers };
}
