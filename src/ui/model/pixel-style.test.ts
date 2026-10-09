import { PALETTES } from '../theme/palettes';
import { pixelizeStyle, type StyleLike } from './pixel-style';

const MAP = PALETTES.c.map;

const base = { type: 'x', source: 'openmaptiles' };

const style: StyleLike = {
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'https://tiles.example/planet' } },
  glyphs: 'https://tiles.example/fonts/{fontstack}/{range}.pbf',
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': 'rgb(242,243,240)' } },
    { ...base, id: 'park', type: 'fill', paint: { 'fill-color': 'rgb(230,233,229)' } },
    { ...base, id: 'landcover_wood', type: 'fill', paint: { 'fill-color': 'rgb(220,224,220)' } },
    { ...base, id: 'landuse_residential', type: 'fill', paint: { 'fill-color': 'rgb(234,234,230)', 'fill-opacity': 0.8 } },
    { ...base, id: 'water', type: 'fill', paint: { 'fill-color': 'rgb(194,200,202)' } },
    { ...base, id: 'waterway', type: 'line', paint: { 'line-color': 'hsl(195,17%,78%)' } },
    { ...base, id: 'building', type: 'fill', paint: { 'fill-color': 'rgb(234,234,229)', 'fill-outline-color': 'rgb(219,219,218)' } },
    { ...base, id: 'highway_minor', type: 'line', paint: { 'line-color': 'hsl(0,0%,88%)', 'line-opacity': 0.9, 'line-width': 2 } },
    { ...base, id: 'highway_major_casing', type: 'line', paint: { 'line-color': 'rgb(213,213,213)', 'line-width': 6 } },
    { ...base, id: 'highway_major_inner', type: 'line', paint: { 'line-color': '#fff', 'line-width': 4 } },
    { ...base, id: 'railway_dashline', type: 'line', paint: { 'line-color': '#fafafa', 'line-width': 2 } },
    { ...base, id: 'boundary_2', type: 'line', paint: { 'line-color': 'hsl(0,0%,70%)' } },
    {
      ...base,
      id: 'highway-name-major',
      type: 'symbol',
      layout: { 'text-font': ['Noto Sans Regular'], 'text-size': 12 },
      paint: { 'text-color': '#666', 'text-halo-color': '#fff', 'text-halo-width': 1 },
    },
    { ...base, id: 'highway-name-minor', type: 'symbol', layout: { 'text-font': ['Noto Sans Regular'] }, paint: { 'text-color': '#666' } },
    { ...base, id: 'highway-shield-non-us', type: 'symbol', layout: { 'icon-image': 'shield' } },
    {
      ...base,
      id: 'label_city',
      type: 'symbol',
      layout: { 'text-font': ['Noto Sans Regular'], 'text-size': 14 },
      paint: { 'text-color': '#000', 'text-halo-color': '#fff' },
    },
    { ...base, id: 'label_country_1', type: 'symbol', layout: { 'text-font': ['Noto Sans Regular'] }, paint: { 'text-color': '#000' } },
    { ...base, id: 'water_name_point_label', type: 'symbol', layout: { 'text-font': ['Noto Sans Italic'] }, paint: { 'text-color': '#495e91' } },
    { ...base, id: 'ne2', type: 'raster' },
  ],
};

const paintOf = (out: StyleLike, id: string) => out.layers.find((l) => l.id === id)?.paint ?? {};

describe('pixelizeStyle', () => {
  const out = pixelizeStyle(style, MAP);

  it('paints land ground, parks and woods lit, water and buildings shade', () => {
    expect(paintOf(out, 'background')['background-color']).toBe(MAP.land);
    expect(paintOf(out, 'park')['fill-color']).toBe(MAP.park);
    expect(paintOf(out, 'landcover_wood')['fill-color']).toBe(MAP.wood);
    expect(paintOf(out, 'landuse_residential')['fill-color']).toBe(MAP.land);
    expect(paintOf(out, 'water')['fill-color']).toBe(MAP.water);
    expect(paintOf(out, 'waterway')['line-color']).toBe(MAP.water);
    expect(paintOf(out, 'building')['fill-color']).toBe(MAP.building);
  });

  it('keeps buildings quiet: opaque, with no outline contrast', () => {
    expect(paintOf(out, 'building')['fill-opacity']).toBe(1);
    expect(paintOf(out, 'building')['fill-outline-color']).toBe(MAP.building);
  });

  it('draws roads as ink with ground inside the wide ones, opaque', () => {
    expect(paintOf(out, 'highway_minor')['line-color']).toBe(MAP.road);
    expect(paintOf(out, 'highway_minor')['line-opacity']).toBe(1);
    expect(paintOf(out, 'highway_major_casing')['line-color']).toBe(MAP.road);
    expect(paintOf(out, 'highway_major_inner')['line-color']).toBe(MAP.roadFill);
    expect(paintOf(out, 'railway_dashline')['line-color']).toBe(MAP.roadFill);
    expect(paintOf(out, 'boundary_2')['line-color']).toBe(MAP.boundary);
  });

  it('keeps labels sparse, in ink with a light halo, and drops rasters', () => {
    const ids = out.layers.map((l) => l.id);
    expect(ids).toContain('highway-name-major');
    expect(ids).toContain('label_city');
    expect(ids).not.toContain('highway-name-minor');
    expect(ids).not.toContain('highway-shield-non-us');
    expect(ids).not.toContain('label_country_1');
    expect(ids).not.toContain('water_name_point_label');
    expect(ids).not.toContain('ne2');
    const label = out.layers.find((l) => l.id === 'label_city')!;
    expect(label.paint?.['text-color']).toBe(MAP.label);
    expect(label.paint?.['text-halo-color']).toBe(MAP.labelHalo);
    expect(label.layout?.['text-font']).toEqual(['Noto Sans Bold']);
  });

  it('uses only palette colors in every color property', () => {
    const palette = Object.values(MAP);
    for (const layer of out.layers) {
      for (const [key, value] of Object.entries(layer.paint ?? {})) {
        if (key.endsWith('-color')) expect(palette).toContain(value);
      }
    }
  });

  it('does not mutate its input and keeps sources and glyphs', () => {
    expect(style.layers).toHaveLength(19);
    expect(paintOf(style, 'park')['fill-color']).toBe('rgb(230,233,229)');
    expect(out.sources).toEqual(style.sources);
    expect(out.glyphs).toBe(style.glyphs);
  });
});
