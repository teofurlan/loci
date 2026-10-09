import { useColorScheme } from 'react-native';

/**
 * Material 3 color roles resolved from the Score-O palette.
 * Color quarantine: `overprint` is for map overprint and control numbers only,
 * `primary` is for the flag mark and the one primary action only.
 */
export type Palette = {
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  primary: string;
  onPrimary: string;
  overprint: string;
  error: string;
  onError: string;
};

export const LIGHT: Palette = {
  background: '#FFFFFF',
  onBackground: '#111111',
  surface: '#FFFFFF',
  onSurface: '#111111',
  surfaceVariant: '#F1F1F1',
  onSurfaceVariant: '#4A4A4A',
  outline: '#111111',
  primary: '#F26B1D',
  onPrimary: '#111111',
  overprint: '#A3238E',
  error: '#B3261E',
  onError: '#FFFFFF',
};

/** Night-O: white rules on black, a lighter overprint purple. */
export const NIGHT: Palette = {
  background: '#000000',
  onBackground: '#FFFFFF',
  surface: '#000000',
  onSurface: '#FFFFFF',
  surfaceVariant: '#1B1B1B',
  onSurfaceVariant: '#C4C4C4',
  outline: '#FFFFFF',
  primary: '#F26B1D',
  onPrimary: '#111111',
  overprint: '#E066CC',
  error: '#FFB4AB',
  onError: '#690005',
};

export const FONTS = {
  medium: 'BarlowCondensed_500Medium',
  semiBold: 'BarlowCondensed_600SemiBold',
  bold: 'BarlowCondensed_700Bold',
} as const;

/** Hard 2 dp ink rules and near-square corners. */
export const SHAPE = { rule: 2, radius: 2, target: 48 } as const;

export type TypeRole = 'display' | 'headline' | 'title' | 'label' | 'body' | 'bodySmall';

type RoleStyle = {
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  fontWeight?: '400' | '500';
  textTransform?: 'uppercase';
};

/** Material type scale roles: Barlow Condensed for display/headline/title/label, system face for body. */
export const TYPE: Record<TypeRole, RoleStyle> = {
  display: { fontFamily: FONTS.bold, fontSize: 56, lineHeight: 60, textTransform: 'uppercase' },
  headline: { fontFamily: FONTS.bold, fontSize: 32, lineHeight: 36, textTransform: 'uppercase' },
  title: { fontFamily: FONTS.semiBold, fontSize: 22, lineHeight: 26, letterSpacing: 0.4 },
  label: { fontFamily: FONTS.semiBold, fontSize: 17, lineHeight: 20, letterSpacing: 0.8, textTransform: 'uppercase' },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  bodySmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
};

export type Theme = { dark: boolean; colors: Palette };

export const lightTheme: Theme = { dark: false, colors: LIGHT };
export const nightTheme: Theme = { dark: true, colors: NIGHT };

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? nightTheme : lightTheme;
}

/** The pocket-mode run screen is strictly two-value; it ignores the theme. */
export const POCKET = { black: '#000000', white: '#FFFFFF' } as const;
