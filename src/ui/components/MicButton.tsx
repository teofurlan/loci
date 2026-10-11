import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../state/use-reduced-motion';
import { useBlink } from '../state/use-typewriter';
import { CHAT } from '../theme/theme';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

type Props = {
  listening: boolean;
  /** True while the recognizer is finishing after a stop. */
  stopping?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** Side of the square chat buttons, dp. */
export const CHAT_BUTTON = 44;

/**
 * Dictation: a square, icon-only button (44 dp) with a line border and a black fill, sitting inside the chat
 * input bar. Listening swaps the mic for a stop square and blinks the fill; the screen adds a "Listening…" line.
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
      <PixelBox fill={lit ? CHAT.accent : CHAT.ground} border={CHAT.line} behind={CHAT.ground} corners="round" stretch>
        <View style={styles.icon}>
          <PixelSprite name={listening ? 'glyph:stop' : 'glyph:mic'} scale={3} inkColor={CHAT.text} />
        </View>
      </PixelBox>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: CHAT_BUTTON, height: CHAT_BUTTON },
  icon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
