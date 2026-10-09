import { PALETTE } from './palette';

/**
 * The Overworld theme. One fixed LCD palette: the system light or dark setting is ignored.
 * Lit is reserved for things you can press (buttons, tappable boxes, sprites, menu rows).
 */
export const COLORS = {
  /** Screen ground on setup, memorize and results. */
  ground: PALETTE.ground,
  /** The run field, and the fill of a pressed button. */
  field: PALETTE.ink,
  /** Every line and all text on ground or lit. */
  ink: PALETTE.ink,
  /** Pressable surfaces, and text on the ink field. */
  lit: PALETTE.lit,
  /** Quiet fills and decorative rules only. Never text on ink. */
  shade: PALETTE.shade,
} as const;

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
