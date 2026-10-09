import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
  return (
    <View style={styles.grid}>
      {Array.from({ length: total }, (_, index) => {
        const punched = visited.has(index);
        const state = punched ? (hinted.has(index) ? 'punched with a hint' : 'punched') : 'missed';
        return (
          <View
            key={index}
            accessible
            accessibilityLabel={`Control ${index + 1}, ${state}`}
            style={[styles.box, { borderColor: colors.outline }]}
          >
            <AppText variant="label" color={colors.overprint} tabular style={styles.number} maxFontSizeMultiplier={1.2}>
              {index + 1}
            </AppText>
            {hinted.has(index) && (
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
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  box: {
    width: 76,
    height: 84,
    borderWidth: SHAPE.rule,
    borderRadius: SHAPE.radius,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  number: { position: 'absolute', top: 2, left: 5, fontSize: 18, lineHeight: 20 },
  hint: { position: 'absolute', top: 1, right: 6, fontFamily: FONTS.bold, fontSize: 22, lineHeight: 24 },
  pins: {},
});
