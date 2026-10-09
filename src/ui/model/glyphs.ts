import { parseGrid, type Sprite } from './sprites';

/** Small UI glyphs on the same four-shade grid, drawn here from scratch. */
const GLYPH_ROWS = {
  /** The blinking advance cursor. */
  down: ['0000000', '0000000', '.00000.', '..000..', '...0...'],
  /** The menu cursor. */
  right: ['0....', '00...', '000..', '0000.', '000..', '00...', '0....'],
  mic: ['..000..', '.00000.', '.00000.', '.00000.', '0.000.0', '0.....0', '.00000.', '...0...', '..000..'],
  stop: ['0000000', '0000000', '0000000', '0000000', '0000000', '0000000', '0000000'],
  mark: ['.0000.', '0....0', '....0.', '...0..', '...0..', '......', '...0..'],
} as const satisfies Record<string, readonly string[]>;

export type GlyphName = keyof typeof GLYPH_ROWS;
export const GLYPH_NAMES = Object.keys(GLYPH_ROWS) as GlyphName[];

export const glyphRows = (name: GlyphName): readonly string[] => GLYPH_ROWS[name];
export const glyphFor = (name: GlyphName): Sprite => parseGrid(GLYPH_ROWS[name]);
