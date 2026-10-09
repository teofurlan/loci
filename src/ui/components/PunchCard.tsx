import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { punchColumns } from '../model/layout';
import { punchPattern, PUNCH_GRID } from '../model/punch-pattern';
import { FONTS, SHAPE, useTheme } from '../theme/theme';
import { AppText } from './AppText';

type Props = {
  total: number;
  visited: ReadonlySet<number>;
  hinted: ReadonlySet<number>;
};

const PIN_AREA = 44;
const CELL = PIN_AREA / PUNCH_GRID;

/** A punch card: one box per control, pin-punched when visited, an orange H when hinted, empty when missed. */
export function PunchCard({ total, visited, hinted }: Props) {
  const { colors } = useTheme();
  const columns = punchColumns(total);
  const rows = Array.from({ length: Math.ceil(total / columns) }, (_, row) => row * columns);
  return (
    <View style={styles.grid}>
      {rows.map((first) => (
        <View key={first} style={styles.row}>
          {Array.from({ length: columns }, (_, column) => {
            const index = first + column;
            if (index >= total) return <View key={index} style={[styles.slot, styles.box, styles.vacant]} />;
        const punched = visited.has(index);
        const state = punched ? (hinted.has(index) ? 'punched with a hint' : 'punched') : 'missed';
        return (
          <View
            key={index}
            accessible
            accessibilityLabel={`Control ${index + 1}, ${state}`}
            style={[styles.slot, styles.box, { borderColor: colors.outline }]}
          >
            <AppText variant="label" color={colors.overprint} tabular style={styles.number} maxFontSizeMultiplier={1.2}>
              {index + 1}
            </AppText>
            {punched && hinted.has(index) && (
              <AppText variant="label" color={colors.primary} style={styles.hint} maxFontSizeMultiplier={1.2}>
                H
              </AppText>
            )}
            {punched && (
              <Svg width={PIN_AREA} height={PIN_AREA} style={styles.pins} accessible={false}>
                {punchPattern(index).map((cell) => (
                  <Circle
                    key={cell}
                    cx={(cell % PUNCH_GRID) * CELL + CELL / 2}
                    cy={Math.floor(cell / PUNCH_GRID) * CELL + CELL / 2}
                    r={2.6}
                    fill={colors.onBackground}
                  />
                ))}
              </Svg>
            )}
          </View>
        );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  slot: { flex: 1 },
  box: {
    height: 84,
    borderWidth: SHAPE.rule,
    borderRadius: SHAPE.radius,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  number: { position: 'absolute', top: 2, left: 5, fontSize: 18, lineHeight: 20 },
  hint: { position: 'absolute', top: 1, right: 6, fontFamily: FONTS.bold, fontSize: 22, lineHeight: 24 },
  vacant: { borderColor: 'transparent' },
  pins: {},
});
