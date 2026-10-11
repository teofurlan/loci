import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { MARK_HEIGHT, MARK_ROWS, MARK_WIDTH } from '../model/mark';
import { parseGrid, spritePaths } from '../model/sprites';
import { COLORS } from '../theme/theme';

type Props = {
  /** Integer multiple of the native 96 x 112 grid: one mark cell is `scale` dp, so every edge stays crisp. */
  scale?: number;
  color?: string;
};

const MARK_PATH = spritePaths(parseGrid(MARK_ROWS))[0] ?? '';

/**
 * The Loci path mark in palette ink: the approved pixel sprite, never stretched or smoothed. Below about
 * 48 dp the checkpoint holes fill in, so use it at scale 1 or more.
 */
function AppMarkView({ scale = 2, color = COLORS.ink }: Props) {
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
