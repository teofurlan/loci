import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { Landmark } from '../../domain/types';
import { COLORS } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

type Props = {
  controls: readonly Landmark[];
  selected: number;
  onSelect: (index: number) => void;
};

/** A strip of stamp-sized thumbnails (number plus kind sprite) for jumping between controls. */
export function StampStrip({ controls, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {controls.map((control, index) => {
        const active = index === selected;
        return (
          <Pressable
            key={control.id}
            accessibilityRole="button"
            accessibilityLabel={`Control ${index + 1}, ${control.name}`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(index)}
          >
            <PixelBox fill={COLORS.lit} behind={COLORS.ground} double={active}>
              <View style={styles.stamp}>
                <AppText variant="label" maxFontSizeMultiplier={1.2} allowFontScaling={false} style={styles.number}>
                  {index + 1}
                </AppText>
                <PixelSprite name={control.kind} scale={2} />
              </View>
            </PixelBox>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 6, gap: 6, alignItems: 'center' },
  stamp: { width: 40, height: 52, alignItems: 'center', justifyContent: 'center', gap: 2 },
  number: { fontSize: 11, lineHeight: 14 },
});
