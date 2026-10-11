import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { advanceElapsed, traceFrame } from '../model/mark-trace';
import { useReducedMotion } from '../state/use-reduced-motion';
import { COLORS } from '../theme/theme';
import { TraceMark } from './TraceMark';

const FRAME_MS = 20;
/**
 * dp per mark cell that the Android 12+ splash actually draws the image at (measured on device: the system scales the
 * 192 dp image to about 0.85 of its size), so the first JS frame lands on the native one. Not an integer, by design.
 */
const SPLASH_CELL_DP = 1.7;
/** With reduced motion the whole mark shows still, held this long (from when the setting is known) so it registers. */
const REDUCED_HOLD_MS = 500;

type Props = {
  /** Called once, after the screen first lays out: the cue to drop the native splash. */
  onShown?: () => void;
  /** Called once when the opening animation has finished. */
  onDone?: () => void;
};

/**
 * The opening screen after the native splash: the Loci path mark centred exactly where the splash drew it,
 * traced from its left end to its right end in pixel steps on the dark run-field ground, then the right
 * ring gives way to the gold found star, the whole mark turns gold and the logo and star twinkle together. The native splash
 * image (same ground) is the first frame of this animation, so the hand-over does not jump. It uses no text,
 * so it can draw before any font is ready.
 */
export function LoadingScreen({ onShown, onDone }: Props) {
  const reducedMotion = useReducedMotion();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [reducedHeld, setReducedHeld] = useState(false);
  const doneRef = useRef(false);
  const laidOutRef = useRef(false);

  useEffect(() => {
    if (startedAt === null) return;
    // Follow the clock, but never skip a trace step if the thread was busy: advanceElapsed caps each tick at one step.
    const timer = setInterval(() => setElapsed((shown) => advanceElapsed(shown, Date.now() - startedAt)), FRAME_MS);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (!reducedMotion) return;
    const timer = setTimeout(() => setReducedHeld(true), REDUCED_HOLD_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  const frame = traceFrame(elapsed, reducedMotion);
  const finished = startedAt !== null && frame.done && (!reducedMotion || reducedHeld);
  useEffect(() => {
    if (!finished || doneRef.current) return;
    doneRef.current = true;
    onDone?.();
  }, [finished, onDone]);

  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      onLayout={() => {
        if (laidOutRef.current) return;
        laidOutRef.current = true;
        onShown?.();
        // Start the clock only once the first frame has been painted (two animation frames after layout), so
        // a busy start-up does not eat the first steps of the trace.
        requestAnimationFrame(() => requestAnimationFrame(() => setStartedAt(Date.now())));
      }}
    >
      <StatusBar style="light" />
      <TraceMark scale={SPLASH_CELL_DP} frame={frame} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.runField, alignItems: 'center', justifyContent: 'center' },
});
