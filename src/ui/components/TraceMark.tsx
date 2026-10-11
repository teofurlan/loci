import { memo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { MARK_HEIGHT, MARK_WIDTH } from '../model/mark';
import { frameRows, RING_CENTRE, STAR_FULL, STAR_SMALL, type TraceFrame } from '../model/mark-trace';
import { parseGrid, spritePaths } from '../model/sprites';
import { COLORS } from '../theme/theme';

type Props = {
  /** Integer multiple of the native 96 x 112 grid, like AppMark. */
  scale?: number;
  frame: TraceFrame;
};

/** The star's pixels are 4 mark cells, so its plus is about as wide as the right ring it replaces. */
const STAR_SCALE = 4;
const starOrigin = (size: number) => ({ x: RING_CENTRE.x - (size * STAR_SCALE) / 2, y: RING_CENTRE.y - (size * STAR_SCALE) / 2 });

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
const FULL = { origin: starOrigin(5), paths: spritePaths(parseGrid(STAR_FULL)) };
const SMALL = { origin: starOrigin(3), paths: spritePaths(parseGrid(STAR_SMALL)) };

/**
 * The Loci path mark written part way along its stroke, in a light ink-on-ink colour; at the end the right ring gives
 * way to the found star, the whole mark turns gold and the logo and star twinkle together. The star is always drawn in
 * the logo's own colour (`frame.logoColour`: gold with the full star, dim gold with the small cross). Meant for the ink
 * run-field ground: the full star's ink outline is invisible there.
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
        <G transform={`translate(${star.origin.x} ${star.origin.y}) scale(${STAR_SCALE})`}>
          {star.paths[0] ? <Path d={star.paths[0]} fill={frame.star === 'full' ? COLORS.runField : (frame.starColour ?? frame.logoColour)} /> : null}
          {star.paths[3] ? <Path d={star.paths[3]} fill={frame.starColour ?? frame.logoColour} /> : null}
        </G>
      ) : null}
    </Svg>
  );
}

export const TraceMark = memo(TraceMarkView);
