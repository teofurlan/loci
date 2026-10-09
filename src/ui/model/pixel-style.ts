import { PALETTE } from '../theme/palette';

type Props = Record<string, unknown>;
export type LayerLike = { id: string; type: string; paint?: Props; layout?: Props; [key: string]: unknown };
export type StyleLike = { version: number; sources: Record<string, unknown>; glyphs?: string; layers: LayerLike[]; [key: string]: unknown };

/** Road names and settlement names only: everything else would crowd the sprites. */
const KEEP_LABELS = /^(highway-name-major|label_(city|city_capital|town|village))$/;
const GREEN = /park|wood|grass|forest|garden|pitch|golf|recreation/;
const BUILDING_OPACITY = 0.4;
const LABEL_FONT = ['Noto Sans Bold'];

function paintFill(layer: LayerLike): Props {
  if (/building/.test(layer.id)) {
    return { 'fill-color': PALETTE.shade, 'fill-outline-color': PALETTE.shade, 'fill-opacity': BUILDING_OPACITY };
  }
  const color = /water/.test(layer.id) ? PALETTE.shade : GREEN.test(layer.id) ? PALETTE.lit : PALETTE.ground;
  return { 'fill-color': color, 'fill-opacity': 1 };
}

function paintLine(layer: LayerLike): Props {
  const { id } = layer;
  const keep = { ...layer.paint };
  let color: string = PALETTE.ink;
  if (/waterway|boundary/.test(id)) color = PALETTE.shade;
  else if (/casing/.test(id)) color = PALETTE.ink;
  else if (/inner|dashline|subtle/.test(id)) color = PALETTE.ground;
  return { ...keep, 'line-color': color, 'line-opacity': 1 };
}

function paintSymbol(layer: LayerLike): LayerLike {
  const { 'icon-image': _icon, ...layout } = layer.layout ?? {};
  return {
    ...layer,
    layout: { ...layout, 'text-font': LABEL_FONT },
    paint: { 'text-color': PALETTE.ink, 'text-halo-color': PALETTE.lit, 'text-halo-width': 1.5, 'text-halo-blur': 0 },
  };
}

/**
 * Recolors an OpenFreeMap (OpenMapTiles) style into the terrain language: parks lit, land ground,
 * water shade, roads ink, buildings quiet shade, sparse ink labels. Pure: the input is not mutated.
 */
export function pixelizeStyle(style: StyleLike): StyleLike {
  const layers: LayerLike[] = [];
  for (const layer of style.layers) {
    switch (layer.type) {
      case 'background':
        layers.push({ ...layer, paint: { 'background-color': PALETTE.ground } });
        break;
      case 'fill':
        layers.push({ ...layer, paint: paintFill(layer) });
        break;
      case 'line':
        layers.push({ ...layer, paint: paintLine(layer) });
        break;
      case 'symbol':
        if (KEEP_LABELS.test(layer.id)) layers.push(paintSymbol(layer));
        break;
      default:
        break;
    }
  }
  return { ...style, layers };
}
