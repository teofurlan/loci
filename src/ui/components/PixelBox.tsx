import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ROUND_INNER, ROUND_OUTER, cornerRects, type CornerRect } from '../model/pixel-corners';
import { COLORS, SHAPE } from '../theme/theme';

type Props = {
  fill: string;
  border?: string;
  /** The color behind the box: the corner notches are painted with it, so corners step instead of rounding. */
  behind: string;
  /**
   * `notch` (the default) cuts one rule off each corner. `round` steps each corner in two (outer rows inset 2N then N,
   * the fill's corner inset N), the "rounded pixel" look. `round` ignores `double`.
   */
  corners?: 'notch' | 'round';
  /** The classic double border: two rules with a gap of fill between them. */
  double?: boolean;
  /** Fill the parent's height, for a box in a flexible slot. Off, the box hugs its content. */
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const N = SHAPE.rule;

function Single({ fill, border = COLORS.line, behind, stretch, style, children }: Omit<Props, 'double'>) {
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

const OUTER_RECTS = cornerRects(ROUND_OUTER, N);
const INNER_RECTS = cornerRects(ROUND_INNER, N);

/** The four mirrors of a top-left corner block, as absolute positions inside a box offset by `inset` on every side. */
function corner(rect: CornerRect, inset: number) {
  return [
    { top: inset + rect.y, left: inset + rect.x },
    { top: inset + rect.y, right: inset + rect.x },
    { bottom: inset + rect.y, left: inset + rect.x },
    { bottom: inset + rect.y, right: inset + rect.x },
  ];
}

function Round({ fill, border = COLORS.line, behind, stretch, style, children }: Omit<Props, 'double' | 'corners'>) {
  return (
    <View style={[{ backgroundColor: border, padding: N }, stretch && styles.stretch, style]}>
      <View style={[styles.inner, stretch && styles.stretch, { backgroundColor: fill }]}>{children}</View>
      {OUTER_RECTS.flatMap((rect, row) =>
        corner(rect, 0).map((place, at) => (
          <View
            key={`o${row}${at}`}
            pointerEvents="none"
            style={[styles.block, place, { width: rect.width, height: rect.height, backgroundColor: behind }]}
          />
        )),
      )}
      {INNER_RECTS.flatMap((rect, row) =>
        corner(rect, N).map((place, at) => (
          <View
            key={`i${row}${at}`}
            pointerEvents="none"
            style={[styles.block, place, { width: rect.width, height: rect.height, backgroundColor: border }]}
          />
        )),
      )}
    </View>
  );
}

/** A hard-edged box with stepped corners, 0 radius. */
export function PixelBox({ double, corners = 'notch', children, ...rest }: Props) {
  if (corners === 'round') return <Round {...rest}>{children}</Round>;
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
  block: { position: 'absolute' },
});
