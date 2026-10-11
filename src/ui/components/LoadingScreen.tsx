import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { advanceElapsed, traceFrame } from '../model/mark-trace';
import { useReducedMotion } from '../state/use-reduced-motion';
import { COLORS } from '../theme/theme';
import { TraceMark } from './TraceMark';

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
 * written like handwriting (the left ring, then one continuous stroke at an even speed, then the right ring) on the dark run-field ground, then the right
 * ring gives way to the gold found star, the whole mark turns gold and the logo and star twinkle together. The native splash
 * image is fully transparent (plain ink, the same ground) and nothing is drawn at t = 0, so the hand-over does not flash. It uses no text,
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
    // The pen advances every frame, at the wall clock's pace, but never jumps ahead if the thread was busy:
    // advanceElapsed caps each tick at about one 60 Hz frame, so a slow frame delays the stroke instead of skipping it.
    let shown = 0;
    let frameId = 0;
    const tick = () => {
      shown = advanceElapsed(shown, Date.now() - startedAt);
      setElapsed(shown);
      if (!traceFrame(shown).done) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
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
