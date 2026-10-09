import { StyleSheet, View } from 'react-native';
import type { LandmarkKind } from '../../domain/types';
import { SHAPE, useTheme } from '../theme/theme';
import { AppText } from './AppText';
import { Pictogram } from './Pictogram';

type Props = {
  number: number;
  kind: LandmarkKind;
  name: string;
  minutes: number;
  /** Story fragment spanning the row beneath. Omitted on the results list. */
  fragment?: string;
  /** Short status printed in place of the minutes, e.g. "Punched". */
  status?: string;
};

/** One row of the control description sheet: number, pictogram, place and minutes, story beneath. */
export function ControlRow({ number, kind, name, minutes, fragment, status }: Props) {
  const { colors } = useTheme();
  const rule = { borderColor: colors.outline };
  return (
    <View style={[styles.row, rule]} accessible accessibilityLabel={`${number}. ${name}. ${status ?? `${minutes} minutes`}. ${fragment ?? ''}`}>
      <View style={styles.cells}>
        <View style={[styles.cell, styles.numberCell, rule]}>
          <AppText variant="headline" color={colors.overprint} tabular maxFontSizeMultiplier={1.2} style={styles.number}>
            {number}
          </AppText>
        </View>
        <View style={[styles.cell, styles.iconCell, rule]}>
          <Pictogram kind={kind} color={colors.onBackground} />
        </View>
        <View style={[styles.nameCell, rule]}>
          <AppText variant="title" numberOfLines={2} style={styles.name}>
            {name}
          </AppText>
          <AppText variant="label" color={colors.onSurfaceVariant} tabular maxFontSizeMultiplier={1.3}>
            {status ?? `${minutes} min`}
          </AppText>
        </View>
      </View>
      {fragment ? (
        <View style={[styles.fragment, rule]}>
          <AppText variant="body">{fragment}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: SHAPE.rule },
  cells: { flexDirection: 'row', alignItems: 'stretch', minHeight: 56 },
  cell: { borderRightWidth: SHAPE.rule, alignItems: 'center', justifyContent: 'center' },
  numberCell: { width: 52 },
  iconCell: { width: 52 },
  nameCell: { flex: 1, paddingHorizontal: 12, paddingVertical: 6, justifyContent: 'center' },
  number: { lineHeight: 34, fontSize: 30 },
  name: { fontSize: 20, lineHeight: 24 },
  fragment: { borderTopWidth: SHAPE.rule, paddingHorizontal: 12, paddingVertical: 10 },
});
