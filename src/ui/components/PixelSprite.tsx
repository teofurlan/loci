import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { glyphFor, type GlyphName } from '../model/glyphs';
import { spriteFor, spritePaths, type PaletteIndex, type Sprite, type SpriteName } from '../model/sprites';
import { COLORS } from '../theme/theme';
import { PALETTE } from '../theme/palettes';

const GLYPH_COLORS = [COLORS.text, COLORS.text, COLORS.accent, COLORS.ground] as const;

type Props = {
  /** A named 32 x 32 sprite, or a small glyph. */
  name: SpriteName | `glyph:${GlyphName}`;
  /** Integer pixel scale: one sprite pixel is `scale` dp, so edges stay crisp. */
  scale: number;
  /** Replaces the outline (index 0) color, e.g. when a glyph sits on a dark button. */
  inkColor?: string;
};

function resolve(name: Props['name']): Sprite {
  return name.startsWith('glyph:') ? glyphFor(name.slice(6) as GlyphName) : spriteFor(name as SpriteName);
}

/** Draws a sprite as merged rects, hard-edged and decorative (hidden from accessibility). */
function PixelSpriteView({ name, scale, inkColor }: Props) {
  const sprite = resolve(name);
  const paths = spritePaths(sprite);
  // Glyphs are text-coloured marks (the pointer also uses the accent); sprites take four colors from the palette.
  const colors = name.startsWith('glyph:') ? GLYPH_COLORS : PALETTE.sprites[name as SpriteName];
  const cols = sprite[0].length;
  return (
    <Svg
      width={cols * scale}
      height={sprite.length * scale}
      viewBox={`0 0 ${cols} ${sprite.length}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {([0, 1, 2, 3] as PaletteIndex[]).map((shade) =>
        paths[shade] ? <Path key={shade} d={paths[shade]} fill={shade === 0 && inkColor ? inkColor : (colors?.[shade] ?? COLORS.text)} /> : null,
      )}
    </Svg>
  );
}

export const PixelSprite = memo(PixelSpriteView);
