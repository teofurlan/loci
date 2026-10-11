import { memo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { MARK_HEIGHT, MARK_WIDTH } from '../model/mark';
import { RING_CENTRE, revealedRows, SPARKLE_FULL, SPARKLE_SMALL } from '../model/mark-trace';
import { parseGrid, spritePaths } from '../model/sprites';
import { PALETTE } from '../theme/palettes';
import { COLORS } from '../theme/theme';

type Props = {
  /** Integer multiple of the native 96 x 112 grid, like AppMark. */
  scale?: number;
  /** How many traced cells are drawn (see `traceFrame`). */
  revealed: number;
  /** 0 none, 1 small gold plus, 2 the full gold sparkle. */
  sparkle: 0 | 1 | 2;
};

const GOLD = PALETTE.sprites['found-b'][3];
/** One sparkle pixel is two mark cells; its centre sits just up and right of the right checkpoint ring. */
const SPARKLE_SCALE = 2;
const SPARKLE_X = RING_CENTRE.x + 12 - (5 * SPARKLE_SCALE) / 2;
const SPARKLE_Y = RING_CENTRE.y - 12 - (5 * SPARKLE_SCALE) / 2;

const markPaths = new Map<number, string>();
const markPathFor = (revealed: number): string => {
  let d = markPaths.get(revealed);
  if (d === undefined) {
    d = spritePaths(parseGrid(revealedRows(revealed)))[0] ?? '';
    markPaths.set(revealed, d);
  }
  return d;
};
const SPARKLES = [null, spritePaths(parseGrid(SPARKLE_SMALL)), spritePaths(parseGrid(SPARKLE_FULL))] as const;

/** The Loci path mark drawn part way along its stroke, with the found sparkle at the right end. Ink stays ink; only the sparkle is gold. */
function TraceMarkView({ scale = 2, revealed, sparkle }: Props) {
  const spark = SPARKLES[sparkle];
  return (
    <Svg
      width={MARK_WIDTH * scale}
      height={MARK_HEIGHT * scale}
      viewBox={`0 0 ${MARK_WIDTH} ${MARK_HEIGHT}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={markPathFor(revealed)} fill={COLORS.ink} />
      {spark ? (
        <G transform={`translate(${SPARKLE_X} ${SPARKLE_Y}) scale(${SPARKLE_SCALE})`}>
          {spark[0] ? <Path d={spark[0]} fill={COLORS.ink} /> : null}
          {spark[3] ? <Path d={spark[3]} fill={GOLD} /> : null}
        </G>
      ) : null}
    </Svg>
  );
}

export const TraceMark = memo(TraceMarkView);
