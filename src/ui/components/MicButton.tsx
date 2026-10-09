import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../state/use-reduced-motion';
import { useBlink } from '../state/use-typewriter';
import { COLORS, SHAPE } from '../theme/theme';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

type Props = {
  listening: boolean;
  /** True while the recognizer is finishing after a stop. */
  stopping?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * Dictation: a square, icon-only button (48 dp) meant for the bottom-right corner of the request box.
 * Listening swaps the mic for a stop square and blinks the fill; the screen adds a "Listening…" line.
 */
export function MicButton({ listening, stopping, disabled, onPress }: Props) {
  const reducedMotion = useReducedMotion();
  const blink = useBlink(reducedMotion, 450);
  const lit = listening && blink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listening ? 'Stop dictation' : 'Speak your request'}
      accessibilityState={{ disabled: !!disabled || !!stopping, selected: listening }}
      disabled={disabled || stopping}
      onPress={onPress}
      style={[styles.root, { opacity: disabled ? 0.5 : 1 }]}
    >
      <PixelBox fill={listening && !lit ? COLORS.ink : COLORS.action} behind={COLORS.panel} stretch>
        <View style={styles.icon}>
          <PixelSprite name={listening ? 'glyph:stop' : 'glyph:mic'} scale={3} inkColor={COLORS.onAction} />
        </View>
      </PixelBox>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: SHAPE.target, height: SHAPE.target },
  icon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
