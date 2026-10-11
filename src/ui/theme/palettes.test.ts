import { KIND_SPRITES, SPRITE_NAMES } from '../model/sprites';
import { contrastRatio } from './palette';
import { PALETTE, textPairs } from './palettes';

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe('the palette (night)', () => {
  it('uses only #RRGGBB tokens', () => {
    const values = [
      ...Object.values(PALETTE.ui),
      ...Object.values(PALETTE.map),
      ...Object.values(PALETTE.loci),
      ...Object.values(PALETTE.sprites).flat(),
    ];
    for (const value of values) expect(value).toMatch(HEX);
  });

  it('sits every screen on one true black ground with soft lavender text, lines and aura', () => {
    expect(PALETTE.ui.ground).toBe('#000000');
    expect(PALETTE.ui.text).toBe('#cfc8dc');
    expect(PALETTE.ui.muted).toBe('#8f86a3');
    expect(PALETTE.ui.line).toBe('#4a4160');
    expect(PALETTE.ui.aura).toBe('#d8ccf2');
  });

  it('has one token set: no panel fill, no separate run field or chat tokens', () => {
    expect(Object.keys(PALETTE.ui).sort()).toEqual(
      ['accent', 'aura', 'found', 'ground', 'line', 'lineStrong', 'muted', 'onAccent', 'onFound', 'onPlate', 'onPressed', 'plate', 'pressed', 'splash', 'text'].sort(),
    );
    expect('chat' in PALETTE).toBe(false);
  });

  it('draws buttons in a violet accent with white labels, flipping to a light pressed state', () => {
    expect(PALETTE.ui.accent).toBe('#6e5f92');
    expect(PALETTE.ui.onAccent).toBe('#ffffff');
    expect(PALETTE.ui.lineStrong).toBe('#6e5f92');
    expect(PALETTE.ui.pressed).toBe('#d8ccf2');
    expect(PALETTE.ui.onPressed).toBe('#000000');
  });

  it('marks found in gold with a black label, and puts sprites on mist plates', () => {
    expect(PALETTE.ui.found).toBe('#ffcd75');
    expect(PALETTE.ui.onFound).toBe('#000000');
    expect(PALETTE.ui.plate).toBe('#cfc8dc');
    expect(PALETTE.ui.onPlate).toBe('#000000');
  });

  it('keeps the opening screen and native splash ground and pen', () => {
    expect(PALETTE.ui.splash).toBe('#1A1C2C');
  });

  it('paints the night map: dark land, lavender major roads, muted minor roads', () => {
    expect(PALETTE.map).toMatchObject({
      land: '#100d16',
      building: '#1d1828',
      park: '#16301f',
      wood: '#1f4a2c',
      water: '#173a5e',
      road: '#6e5f92',
      roadMinor: '#3a3250',
      boundary: '#4a4160',
      label: '#cfc8dc',
      labelHalo: '#000000',
    });
    expect(contrastRatio(PALETTE.map.road, PALETTE.map.land)).toBeGreaterThan(contrastRatio(PALETTE.map.roadMinor, PALETTE.map.land));
  });

  it('gives every sprite exactly four colors', () => {
    for (const sprite of SPRITE_NAMES) expect(PALETTE.sprites[sprite]).toHaveLength(4);
    for (const kind of KIND_SPRITES) expect(PALETTE.sprites[kind]).toBeDefined();
  });

  it('meets WCAG AA on every text and background pair the UI uses', () => {
    const pairs = textPairs(PALETTE);
    expect(pairs.length).toBeGreaterThanOrEqual(9);
    for (const pair of pairs) {
      const ratio = contrastRatio(pair.fg, pair.bg);
      const need = pair.size === 'body' ? 4.5 : 3;
      expect({ pair: pair.name, ok: ratio >= need }).toEqual({ pair: pair.name, ok: true });
    }
  });

  it('lists the pairs each surface draws', () => {
    const names = textPairs(PALETTE).map((pair) => pair.name);
    for (const name of [
      'text on ground',
      'muted on ground',
      'aura on ground',
      'onAccent on accent',
      'onPressed on pressed',
      'onFound on found',
      'onPlate on plate',
      'map label on land',
      'map label on halo',
    ]) {
      expect(names).toContain(name);
    }
  });

  it('keeps interactive outlines and the primary fill at 3:1 on black, decorative lines softer', () => {
    expect(contrastRatio(PALETTE.ui.lineStrong, PALETTE.ui.ground)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(PALETTE.ui.accent, PALETTE.ui.ground)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(PALETTE.ui.found, PALETTE.ui.ground)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(PALETTE.ui.line, PALETTE.ui.ground)).toBeGreaterThan(1.5);
  });

  it('keeps green for nature only: found is gold, no UI token is green', () => {
    const isGreen = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return g > r + 10 && g > b + 10;
    };
    expect(isGreen(PALETTE.map.park)).toBe(true);
    expect(isGreen(PALETTE.map.wood)).toBe(true);
    for (const value of Object.values(PALETTE.ui)) expect(isGreen(value)).toBe(false);
    for (const kind of ['water', 'monument', 'artwork', 'worship', 'fountain', 'library', 'square', 'viewpoint', 'other', 'museum', 'theatre', 'playground', 'stadium', 'statue', 'tower', 'station', 'market'] as const) {
      for (const color of PALETTE.sprites[kind]) expect(isGreen(color)).toBe(false);
    }
  });

  it('draws each kind sprite with a distinct color set', () => {
    const keys = new Set(KIND_SPRITES.map((k) => PALETTE.sprites[k].join()));
    expect(keys.size).toBeGreaterThanOrEqual(12);
  });

  it('draws the unknown sprite on a plate with a muted shade', () => {
    expect(PALETTE.sprites.unknown[2]).toBe(PALETTE.ui.plate);
    expect(PALETTE.sprites.unknown[1]).toBe(PALETTE.ui.muted);
  });
});
