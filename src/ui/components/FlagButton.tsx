import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { SHAPE, TYPE, useTheme } from '../theme/theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
};

const INK = '#111111';
const HEIGHT = 64;

/**
 * The single primary action: an orienteering control flag, orange and white split on the
 * diagonal. Ink label on both halves keeps contrast above 6:1.
 */
export function FlagButton({ label, onPress, disabled, loading, accessibilityHint }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: '#00000033' }}
      onLayout={onLayout}
      style={[styles.root, { borderColor: INK, opacity: disabled ? 0.45 : 1 }]}
    >
      {width > 0 && (
        <Svg width={width} height={HEIGHT} style={StyleSheet.absoluteFill}>
          <Polygon points={`0,0 ${width},0 0,${HEIGHT}`} fill={colors.primary} />
          <Polygon points={`${width},0 ${width},${HEIGHT} 0,${HEIGHT}`} fill="#FFFFFF" />
        </Svg>
      )}
      <View style={styles.labelWrap} pointerEvents="none">
        <AppText variant="headline" color={INK} style={styles.label} maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {loading ? `${label}…` : label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: HEIGHT,
    borderWidth: SHAPE.rule,
    borderRadius: SHAPE.radius,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  labelWrap: { alignItems: 'center', paddingHorizontal: 16 },
  label: { fontSize: TYPE.headline.fontSize - 6, lineHeight: TYPE.headline.lineHeight - 4 },
});
