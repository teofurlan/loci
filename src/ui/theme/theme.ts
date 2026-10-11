import { PALETTE } from './palettes';

/**
 * The semantic color tokens of the world's one palette (see `palettes.ts`). Green appears only as
 * `found`, in the map's parks and woods, and in the park sprite.
 */
export const COLORS = PALETTE.ui;

export const FONTS = {
  // Jersey 10 (OFL): its 5 never reads as an S, and it carries the © sign. Pixelify Sans failed both.
  body: 'Jersey10_400Regular',
  bodyBold: 'Jersey10_400Regular',
  label: 'PressStart2P_400Regular',
} as const;

/** Hard 2 dp rules and square corners. The step notch of a pixel border is one rule wide. */
export const SHAPE = { rule: 2, target: 48 } as const;

export type TypeRole = 'display' | 'headline' | 'title' | 'label' | 'body' | 'bodySmall';

type RoleStyle = { fontFamily: string; fontSize: number; lineHeight: number };

/**
 * Pixel faces need generous sizes: Jersey 10 runs at 26 sp for the story, and Press Start 2P,
 * a wide face, stays short and sparse. Both scale with the system font size.
 */
export const TYPE: Record<TypeRole, RoleStyle> = {
  display: { fontFamily: FONTS.label, fontSize: 22, lineHeight: 32 },
  headline: { fontFamily: FONTS.label, fontSize: 16, lineHeight: 26 },
  title: { fontFamily: FONTS.bodyBold, fontSize: 30, lineHeight: 34 },
  label: { fontFamily: FONTS.label, fontSize: 12, lineHeight: 20 },
  body: { fontFamily: FONTS.body, fontSize: 26, lineHeight: 30 },
  bodySmall: { fontFamily: FONTS.body, fontSize: 22, lineHeight: 26 },
};
