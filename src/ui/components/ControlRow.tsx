import { StyleSheet, View } from 'react-native';
import type { LandmarkKind } from '../../domain/types';
import { COLORS } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

type Props = {
  number: number;
  kind: LandmarkKind;
  name: string;
  /** Short status printed under the name, e.g. "Punched". */
  status: string;
};

/** One line of the results list: kind sprite, number and place name, then the status. */
export function ControlRow({ number, kind, name, status }: Props) {
  return (
    <View accessible accessibilityLabel={`${number}. ${name}. ${status}`} style={styles.row}>
      <PixelBox fill={COLORS.lit} behind={COLORS.ground}>
        <View style={styles.plate}>
          <PixelSprite name={kind} scale={2} />
        </View>
      </PixelBox>
      <View style={styles.text}>
        <AppText variant="body" numberOfLines={2}>
          {number}. {name}
        </AppText>
        <AppText variant="bodySmall">{status}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  plate: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
});
