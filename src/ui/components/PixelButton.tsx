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
  /** `primary` is the one big action; `onInk` is for the ink field of the run screen. */
  variant?: 'primary' | 'secondary' | 'onInk';
  disabled?: boolean;
  loading?: boolean;
  glyph?: GlyphName;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  selected?: boolean;
};

/** A pixel button in the action color. Pressed, it flips to an ink fill; on the run field it inverts. */
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
  const onInk = variant === 'onInk';
  const flipped = pressed || selected;
  const fill = onInk
    ? flipped
      ? COLORS.runText
      : COLORS.runField
    : flipped
      ? COLORS.ink
      : COLORS.action;
  const text = onInk ? (flipped ? COLORS.runField : COLORS.runText) : COLORS.onAction;
  const border = onInk ? COLORS.runText : COLORS.ink;
  const behind = onInk ? COLORS.runField : COLORS.ground;
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
      <PixelBox fill={fill} border={border} behind={behind} double={variant === 'primary'}>
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 14 },
  primary: { minHeight: 64 - 4 * SHAPE.rule, paddingVertical: 8 },
  secondary: { minHeight: SHAPE.target - 2 * SHAPE.rule, paddingVertical: 6 },
  label: { flexShrink: 1, textAlign: 'center' },
});
