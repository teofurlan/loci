import { StyleSheet, View } from 'react-native';
import { PixelButton } from './PixelButton';

type Props = {
  listening: boolean;
  /** True while the recognizer is finishing after a stop. */
  stopping?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** Dictation control: a lit pixel button with a pixel mic, or a stop square while listening. */
export function MicButton({ listening, stopping, disabled, onPress }: Props) {
  const label = stopping ? 'Finishing…' : listening ? 'Listening… tap to stop' : 'Speak your request';
  return (
    <View style={styles.root}>
      <PixelButton
        label={label}
        glyph={listening ? 'stop' : 'mic'}
        selected={listening}
        disabled={disabled || stopping}
        accessibilityLabel={listening ? 'Stop dictation' : 'Dictate course request'}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { alignSelf: 'flex-start' } });
