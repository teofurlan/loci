/**
 * The one self-contained four-shade LCD palette. It never follows the system theme.
 * Text pairings: ink on ground, ink on lit, lit or ground on ink. Never shade text on ink.
 */
export const PALETTE = {
  ink: '#0F380F',
  shade: '#306230',
  ground: '#8BAC0F',
  lit: '#9BBC0F',
} as const;

/** The palette in index order: sprite pixel values 0..3 index into this. */
export const SHADES = [PALETTE.ink, PALETTE.shade, PALETTE.ground, PALETTE.lit] as const;

const channel = (hex: string, offset: number): number => {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number =>
  0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);

/** WCAG 2 contrast ratio between two `#RRGGBB` colors. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
