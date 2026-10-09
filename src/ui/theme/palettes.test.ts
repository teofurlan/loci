import { KIND_SPRITES, SPRITE_NAMES } from '../model/sprites';
import { contrastRatio } from './palette';
import { PALETTE, textPairs } from './palettes';

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe('the palette (Sweetie 16)', () => {
  it('uses only #RRGGBB tokens', () => {
    const values = [
      ...Object.values(PALETTE.ui),
      ...Object.values(PALETTE.map),
      ...Object.values(PALETTE.sprites).flat(),
    ];
    for (const value of values) expect(value).toMatch(HEX);
  });

  it('has no black or white ground, and a dark non-black run field', () => {
    for (const ground of [PALETTE.ui.ground, PALETTE.ui.panel, PALETTE.ui.runField]) {
      expect(ground.toUpperCase()).not.toBe('#000000');
      expect(ground.toUpperCase()).not.toBe('#FFFFFF');
    }
    expect(contrastRatio(PALETTE.ui.runField, '#000000')).toBeGreaterThan(1.1);
    expect(contrastRatio(PALETTE.ui.runField, '#FFFFFF')).toBeGreaterThan(8);
  });

  it('gives every sprite exactly four colors', () => {
    for (const sprite of SPRITE_NAMES) expect(PALETTE.sprites[sprite]).toHaveLength(4);
    for (const kind of KIND_SPRITES) expect(PALETTE.sprites[kind]).toBeDefined();
  });

  it('meets WCAG AA on every text and background pair the UI uses', () => {
    const pairs = textPairs(PALETTE);
    expect(pairs.length).toBeGreaterThan(8);
    for (const pair of pairs) {
      const ratio = contrastRatio(pair.fg, pair.bg);
      const need = pair.size === 'body' ? 4.5 : 3;
      expect({ pair: pair.name, ok: ratio >= need }).toEqual({ pair: pair.name, ok: true });
    }
  });

  it('keeps green for nature and found only', () => {
    const isGreen = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return g > r + 20 && g > b + 20;
    };
    expect(isGreen(PALETTE.map.park)).toBe(true);
    expect(isGreen(PALETTE.ui.found)).toBe(true);
    for (const token of ['ground', 'panel', 'ink', 'muted', 'action', 'onAction', 'runField', 'runText'] as const) {
      expect(isGreen(PALETTE.ui[token])).toBe(false);
    }
    for (const kind of ['water', 'monument', 'artwork', 'worship', 'fountain', 'library', 'square', 'viewpoint', 'other'] as const) {
      for (const color of PALETTE.sprites[kind]) expect(isGreen(color)).toBe(false);
    }
  });

  it('draws each kind sprite with a distinct color set', () => {
    const keys = new Set(KIND_SPRITES.map((k) => PALETTE.sprites[k].join()));
    expect(keys.size).toBeGreaterThanOrEqual(7);
  });
});
