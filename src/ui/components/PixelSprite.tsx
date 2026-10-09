import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { glyphFor, type GlyphName } from '../model/glyphs';
import { spriteFor, spritePaths, type PaletteIndex, type Sprite, type SpriteName } from '../model/sprites';
import { SHADES } from '../theme/palette';

type Props = {
  /** A named 16 x 16 sprite, or a small glyph. */
  name: SpriteName | `glyph:${GlyphName}`;
  /** Integer pixel scale: one sprite pixel is `scale` dp, so edges stay crisp. */
  scale: number;
  /** Replaces the ink (index 0) color, e.g. lit when a glyph sits on an ink field. */
  inkColor?: string;
};

function resolve(name: Props['name']): Sprite {
  return name.startsWith('glyph:') ? glyphFor(name.slice(6) as GlyphName) : spriteFor(name as SpriteName);
}

/** Draws a sprite as merged rects, hard-edged and decorative (hidden from accessibility). */
function PixelSpriteView({ name, scale, inkColor }: Props) {
  const sprite = resolve(name);
  const paths = spritePaths(sprite);
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
        paths[shade] ? <Path key={shade} d={paths[shade]} fill={shade === 0 && inkColor ? inkColor : SHADES[shade]} /> : null,
      )}
    </Svg>
  );
}

export const PixelSprite = memo(PixelSpriteView);
