import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { GlyphName } from '../model/glyphs';
import { COLORS, SHAPE } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

type Props = {
  label: string;
  onPress: () => void;
  /** `primary` is the one big action; `secondary` an outlined control; `quiet` a low-emphasis one (Give up). */
  variant?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
  loading?: boolean;
  glyph?: GlyphName;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  selected?: boolean;
};

/** A pixel button on the black field: accent fill, or a black fill with an outline. Pressed or selected, it flips to the light pressed fill. */
export function PixelButton({
  label,
  onPress,
  variant = 'secondary',
  disabled,
  loading,
  glyph,
  accessibilityLabel,
  accessibilityHint,
  selected,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;
  const flipped = pressed || selected;
  const rest = REST[variant];
  const fill = flipped ? COLORS.pressed : rest.fill;
  const border = flipped ? COLORS.pressed : rest.border;
  const text = flipped ? COLORS.onPressed : rest.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading, selected: !!selected }}
      disabled={inactive}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <PixelBox fill={fill} border={border} behind={COLORS.ground} corners="round">
        <View style={[styles.row, variant === 'primary' ? styles.primary : styles.secondary]}>
          {glyph && <PixelSprite name={`glyph:${glyph}`} scale={3} inkColor={text} />}
          <AppText
            variant={variant === 'primary' ? 'headline' : 'label'}
            color={text}
            maxFontSizeMultiplier={1.3}
            style={styles.label}
          >
            {loading ? `${label}…` : label}
          </AppText>
        </View>
      </PixelBox>
    </Pressable>
  );
}

/** The resting colours of each variant: the primary is filled with the accent, the others are black with an outline. */
const REST = {
  primary: { fill: COLORS.accent, border: COLORS.accent, text: COLORS.onAccent },
  secondary: { fill: COLORS.ground, border: COLORS.lineStrong, text: COLORS.text },
  quiet: { fill: COLORS.ground, border: COLORS.line, text: COLORS.muted },
} as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 14 },
  primary: { minHeight: 64 - 4 * SHAPE.rule, paddingVertical: 8 },
  secondary: { minHeight: SHAPE.target - 2 * SHAPE.rule, paddingVertical: 6 },
  label: { flexShrink: 1, textAlign: 'center' },
});
