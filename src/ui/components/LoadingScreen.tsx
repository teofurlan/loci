import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { filledSegments, LOADING_SEGMENTS, SEGMENT_MS } from '../model/loading-bar';
import { useReducedMotion } from '../state/use-reduced-motion';
import { COLORS, SHAPE } from '../theme/theme';
import { AppMark } from './AppMark';
import { PixelBox } from './PixelBox';

/**
 * Shown after the native splash while fonts and assets load: the mark and a pixel loading bar in the
 * palette. It uses no text, so it can draw before any font is ready.
 */
export function LoadingScreen() {
  const reducedMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (reducedMotion) return;
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), SEGMENT_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);
  const lit = filledSegments(elapsed, reducedMotion);
  return (
    <View style={styles.root} accessible accessibilityLabel="Loading" accessibilityRole="progressbar">
      <AppMark />
      <PixelBox fill={COLORS.panel} behind={COLORS.ground} double>
        <View style={styles.bar}>
          {Array.from({ length: LOADING_SEGMENTS }, (_, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: i < lit ? COLORS.action : COLORS.ground }]} />
          ))}
        </View>
      </PixelBox>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ground, alignItems: 'center', justifyContent: 'center', gap: 28 },
  bar: { flexDirection: 'row', gap: 4, padding: 6 },
  segment: { width: 18, height: 18, borderWidth: SHAPE.rule / 2, borderColor: COLORS.ink },
});
