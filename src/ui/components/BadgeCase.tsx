import { StyleSheet, View } from 'react-native';
import type { LandmarkKind } from '../../domain/types';
import { badgeSlots, type BadgeSlot } from '../model/badges';
import { punchColumns } from '../model/layout';
import { COLORS, SHAPE } from '../theme/theme';
import { AppText } from './AppText';
import { PixelBox } from './PixelBox';
import { PixelSprite } from './PixelSprite';

type Props = {
  kinds: readonly LandmarkKind[];
  visited: ReadonlySet<number>;
  hinted: ReadonlySet<number>;
};

const STATE_WORDS = { found: 'found', hinted: 'found with a hint', missed: 'missed' } as const;

function Badge({ slot }: { slot: BadgeSlot }) {
  const label = `Control ${slot.number}, ${STATE_WORDS[slot.state]}`;
  if (slot.state === 'missed') {
    return (
      <View accessible accessibilityLabel={label} style={[styles.slot, styles.empty]}>
        <AppText variant="label" allowFontScaling={false} style={styles.emptyNumber}>
          {slot.number}
        </AppText>
      </View>
    );
  }
  return (
    <View accessible accessibilityLabel={label} style={styles.slot}>
      <PixelBox fill={COLORS.lit} behind={COLORS.ground} double style={styles.fill}>
        <View style={styles.badge}>
          <PixelSprite name={slot.kind} scale={3} />
          <AppText variant="label" allowFontScaling={false} style={styles.number}>
            {slot.number}
          </AppText>
          {slot.state === 'hinted' && (
            <View style={styles.mark}>
              <PixelSprite name="glyph:mark" scale={2} />
            </View>
          )}
        </View>
      </PixelBox>
    </View>
  );
}

/** The badge case: a badge per found place carrying its kind sprite, a "?" on hinted finds, empty outlines for misses. */
export function BadgeCase({ kinds, visited, hinted }: Props) {
  const slots = badgeSlots(kinds, visited, hinted);
  const columns = punchColumns(slots.length);
  const rows = Array.from({ length: Math.ceil(slots.length / columns) }, (_, row) => slots.slice(row * columns, row * columns + columns));
  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].index} style={styles.row}>
          {row.map((slot) => (
            <Badge key={slot.index} slot={slot} />
          ))}
          {Array.from({ length: columns - row.length }, (_, pad) => (
            <View key={`pad${pad}`} style={styles.slot} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  slot: { flex: 1, height: 96 },
  fill: { flex: 1 },
  badge: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  number: { fontSize: 11, lineHeight: 14 },
  mark: { position: 'absolute', top: 4, right: 4 },
  empty: { borderWidth: SHAPE.rule, borderColor: COLORS.ink, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  emptyNumber: { fontSize: 11, lineHeight: 14 },
});
