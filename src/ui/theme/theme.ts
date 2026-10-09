import { PALETTE } from './palettes';

/**
 * The semantic color tokens of the world's one palette (see `palettes.ts`). Green appears only as
 * `found`, in the map's parks and woods, and in the park sprite.
 */
export const COLORS = PALETTE.ui;

export const FONTS = {
  body: 'PixelifySans_400Regular',
  bodyBold: 'PixelifySans_600SemiBold',
  label: 'PressStart2P_400Regular',
} as const;

/** Hard 2 dp rules and square corners. The step notch of a pixel border is one rule wide. */
export const SHAPE = { rule: 2, target: 48 } as const;

export type TypeRole = 'display' | 'headline' | 'title' | 'label' | 'body' | 'bodySmall';

type RoleStyle = { fontFamily: string; fontSize: number; lineHeight: number };

/**
 * Pixel faces need generous sizes: Pixelify Sans runs at 20 sp for the story, and Press Start 2P,
 * a wide face, stays short and sparse. Both scale with the system font size.
 */
export const TYPE: Record<TypeRole, RoleStyle> = {
  display: { fontFamily: FONTS.label, fontSize: 22, lineHeight: 32 },
  headline: { fontFamily: FONTS.label, fontSize: 16, lineHeight: 26 },
  title: { fontFamily: FONTS.bodyBold, fontSize: 24, lineHeight: 30 },
  label: { fontFamily: FONTS.label, fontSize: 12, lineHeight: 20 },
  body: { fontFamily: FONTS.body, fontSize: 20, lineHeight: 28 },
  bodySmall: { fontFamily: FONTS.body, fontSize: 17, lineHeight: 24 },
};
