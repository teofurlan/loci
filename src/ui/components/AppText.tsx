import { Text, type TextProps } from 'react-native';
import { TYPE, useTheme, type TypeRole } from '../theme/theme';

export type AppTextProps = TextProps & {
  variant?: TypeRole;
  color?: string;
  /** Tabular figures keep timers and numbers from jittering. */
  tabular?: boolean;
};

/** Themed text mapped to a Material type scale role. */
export function AppText({ variant = 'body', color, tabular, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        TYPE[variant],
        { color: color ?? colors.onBackground },
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
