import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, SHAPE } from '../theme/theme';

type Props = {
  fill: string;
  border?: string;
  /** The color behind the box: the corner notches are painted with it, so corners step instead of rounding. */
  behind: string;
  /** The classic double border: two rules with a gap of fill between them. */
  double?: boolean;
  /** Fill the parent's height, for a box in a flexible slot. Off, the box hugs its content. */
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const N = SHAPE.rule;

function Single({ fill, border = COLORS.ink, behind, stretch, style, children }: Omit<Props, 'double'>) {
  return (
    <View style={[{ backgroundColor: border, padding: N }, stretch && styles.stretch, style]}>
      <View style={[styles.inner, stretch && styles.stretch, { backgroundColor: fill }]}>{children}</View>
      <View pointerEvents="none" style={[styles.notch, { top: 0, left: 0, backgroundColor: behind }]} />
      <View pointerEvents="none" style={[styles.notch, { top: 0, right: 0, backgroundColor: behind }]} />
      <View pointerEvents="none" style={[styles.notch, { bottom: 0, left: 0, backgroundColor: behind }]} />
      <View pointerEvents="none" style={[styles.notch, { bottom: 0, right: 0, backgroundColor: behind }]} />
    </View>
  );
}

/** A hard-edged box with stepped corners, 0 radius. */
export function PixelBox({ double, children, ...rest }: Props) {
  if (!double) return <Single {...rest}>{children}</Single>;
  return (
    <Single {...rest}>
      <View style={[{ padding: N }, rest.stretch && styles.stretch]}>
        <Single fill={rest.fill} border={rest.border} behind={rest.fill} stretch={rest.stretch}>
          {children}
        </Single>
      </View>
    </Single>
  );
}

const styles = StyleSheet.create({
  inner: { flexShrink: 1 },
  stretch: { flex: 1 },
  notch: { position: 'absolute', width: N, height: N },
});
