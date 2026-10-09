import { Pressable, StyleSheet } from 'react-native';
import { SHAPE, useTheme } from '../theme/theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Override the ink color, for the two-value pocket screen. */
  color?: string;
  accessibilityHint?: string;
};

/** Secondary action: a 2 dp ink rule box, 48 dp minimum, no fill. */
export function RuleButton({ label, onPress, disabled, color, accessibilityHint }: Props) {
  const { colors } = useTheme();
  const ink = color ?? colors.onBackground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: `${ink}33` }}
      style={[styles.root, { borderColor: ink, opacity: disabled ? 0.45 : 1 }]}
    >
      <AppText variant="label" color={ink} maxFontSizeMultiplier={1.4}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: SHAPE.target,
    minWidth: SHAPE.target,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: SHAPE.rule,
    borderRadius: SHAPE.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
