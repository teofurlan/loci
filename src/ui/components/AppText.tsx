import { Text, type TextProps } from 'react-native';
import { COLORS, TYPE, type TypeRole } from '../theme/theme';

export type AppTextProps = TextProps & {
  variant?: TypeRole;
  color?: string;
};

/** Text in one of the pixel type roles. Ink by default. */
export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[TYPE[variant], { color: color ?? COLORS.ink }, style]} />;
}
