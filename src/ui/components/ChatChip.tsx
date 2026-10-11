import { Pressable, StyleSheet, View } from 'react-native';
import { COLORS } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

/** A compact rounded-pixel chip: a line border on black. Example prompts and the message actions use it. */
export function ChatChip({ label, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={{ top: 4, bottom: 4 }}
      onPress={onPress}
      style={[styles.root, { opacity: disabled ? 0.5 : 1 }]}
    >
      <PixelBox fill={COLORS.ground} border={COLORS.line} behind={COLORS.ground} corners="round">
        <View style={styles.body}>
          <AppText variant="bodySmall" color={COLORS.text} maxFontSizeMultiplier={1.3}>
            {label}
          </AppText>
        </View>
      </PixelBox>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { maxWidth: '100%', minHeight: 36, justifyContent: 'center' },
  body: { paddingHorizontal: 10, paddingVertical: 4 },
});
