import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { MARK_HEIGHT, MARK_ROWS, MARK_WIDTH } from '../model/mark';
import { parseGrid, spritePaths } from '../model/sprites';
import { COLORS } from '../theme/theme';

type Props = {
  /** dp per mark cell of the 60 x 70 grid; a whole number keeps every edge crisp. */
  scale?: number;
  color?: string;
};

const MARK_PATH = spritePaths(parseGrid(MARK_ROWS))[0] ?? '';

/**
 * The Loci path mark in the palette text colour: the approved pixel sprite, never stretched or smoothed. Below about
 * 48 dp the checkpoint holes fill in, so use it at scale 1 or more.
 */
function AppMarkView({ scale = 2, color = COLORS.text }: Props) {
  return (
    <Svg
      width={MARK_WIDTH * scale}
      height={MARK_HEIGHT * scale}
      viewBox={`0 0 ${MARK_WIDTH} ${MARK_HEIGHT}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={MARK_PATH} fill={color} />
    </Svg>
  );
}

export const AppMark = memo(AppMarkView);
