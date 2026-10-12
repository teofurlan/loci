import { memo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { MARK_HEIGHT, MARK_WIDTH } from '../model/mark';
import { frameRows, type TraceFrame } from '../model/mark-trace';
import { starSprite } from '../model/mark-star';
import { parseGrid, spritePaths } from '../model/sprites';

type Props = {
  /** dp per mark cell of the 60 x 70 grid. The opening draws it at a fractional size (see LoadingScreen). */
  scale?: number;
  frame: TraceFrame;
};

const markPaths = new Map<string, string>();
const markPathFor = (frame: TraceFrame): string => {
  const key = `${frame.revealed}:${frame.ringHidden}`;
  let d = markPaths.get(key);
  if (d === undefined) {
    d = spritePaths(parseGrid(frameRows(frame)))[0] ?? '';
    markPaths.set(key, d);
  }
  return d;
};
/** The sparkle as paths on the mark's grid: `0` is its body, `3` its light core (the bright frame only). */
const starFor = (small: boolean) => {
  const { x, y, rows } = starSprite(small);
  return { x, y, paths: spritePaths(parseGrid(rows)) };
};
const FULL = starFor(false);
const SMALL = starFor(true);

/**
 * The Loci path mark written part way along its stroke, in Loci's light violet on black; at the end the right ring gives
 * way to the four-point sparkle, the whole mark turns gold and the logo and star twinkle together. The star is always
 * drawn in the logo's own colour (`frame.logoColour`: gold, or dim gold on the small frame), and the bright one has a
 * light core (`frame.coreColour`).
 */
function TraceMarkView({ scale = 2, frame }: Props) {
  const star = frame.star === 'full' ? FULL : frame.star === 'small' ? SMALL : null;
  return (
    <Svg
      width={MARK_WIDTH * scale}
      height={MARK_HEIGHT * scale}
      viewBox={`0 0 ${MARK_WIDTH} ${MARK_HEIGHT}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={markPathFor(frame)} fill={frame.logoColour} />
      {star ? (
        <G transform={`translate(${star.x} ${star.y})`}>
          {star.paths[0] ? <Path d={star.paths[0]} fill={frame.starColour ?? frame.logoColour} /> : null}
          {star.paths[3] ? <Path d={star.paths[3]} fill={frame.coreColour ?? frame.starColour ?? frame.logoColour} /> : null}
        </G>
      ) : null}
    </Svg>
  );
}

export const TraceMark = memo(TraceMarkView);
