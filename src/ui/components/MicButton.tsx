import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MIC_PICTOGRAM, STOP_PICTOGRAM } from '../model/pictograms';
import { SHAPE, useTheme } from '../theme/theme';
import { AppText } from './AppText';

type Props = {
  listening: boolean;
  /** True while the recognizer is finishing after a stop. */
  stopping?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** Dictation control: a 2 dp ink rule box (RuleButton family) with a drawn mic, or a stop square while listening. */
export function MicButton({ listening, stopping, disabled, onPress }: Props) {
  const { colors } = useTheme();
  const ink = colors.onBackground;
  const label = stopping ? 'Finishing…' : listening ? 'Listening… tap to stop' : 'Speak your request';
  const paths = listening ? STOP_PICTOGRAM : MIC_PICTOGRAM;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listening ? 'Stop dictation' : 'Dictate course request'}
      accessibilityState={{ disabled: !!disabled || !!stopping, selected: listening }}
      disabled={disabled || stopping}
      onPress={onPress}
      android_ripple={{ color: `${ink}33` }}
      style={[styles.root, { borderColor: ink, opacity: disabled ? 0.45 : 1 }]}
    >
      <View style={[styles.icon, listening && { backgroundColor: ink }]}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" accessible={false}>
          {paths.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke={listening ? colors.background : ink}
              fill={listening ? colors.background : 'none'}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>
      <AppText variant="label" color={ink} maxFontSizeMultiplier={1.4} accessibilityLiveRegion="polite">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: SHAPE.target,
    minWidth: SHAPE.target,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: SHAPE.rule,
    borderRadius: SHAPE.radius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
  },
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: SHAPE.radius },
});
