import { Pressable, StyleSheet, View } from 'react-native';
import { useBlink } from '../state/use-typewriter';
import { useReducedMotion } from '../state/use-reduced-motion';
import { COLORS } from '../theme/theme';
import { CHAT_BUTTON } from './MicButton';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  /** Planning is under way: the arrow steps aside for a pulsing block and the button ignores presses. */
  busy?: boolean;
};

/** Send: a square accent button (44 dp) with a white up arrow, at the right end of the chat input bar. */
export function SendButton({ onPress, disabled, busy }: Props) {
  const reducedMotion = useReducedMotion();
  const blink = useBlink(reducedMotion, 450);
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={busy ? 'Planning your route' : 'Send'}
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      disabled={inactive}
      onPress={onPress}
      style={[styles.root, { opacity: disabled && !busy ? 0.5 : 1 }]}
    >
      <PixelBox fill={COLORS.accent} border={COLORS.accent} behind={COLORS.ground} corners="round" stretch>
        <View style={styles.icon}>
          {busy ? (
            <View style={[styles.busy, { opacity: blink ? 1 : 0.35 }]} />
          ) : (
            <PixelSprite name="glyph:send" scale={3} inkColor={COLORS.onAccent} />
          )}
        </View>
      </PixelBox>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: CHAT_BUTTON, height: CHAT_BUTTON },
  icon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  busy: { width: 12, height: 12, backgroundColor: COLORS.onAccent },
});
