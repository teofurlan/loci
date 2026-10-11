import { memo, useEffect, useMemo, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { LOCI_COLS, LOCI_FPS, frameAt, frameSeconds, lociGrid, lociPaths, lociPose, lociRows, type LociPaint, type LociState } from '../model/loci';
import { useReducedMotion } from '../state/use-reduced-motion';
import { PALETTE } from '../theme/palettes';

type Props = {
  state: LociState;
  /** Rendered width in dp; the height follows from the grid's aspect ratio. */
  size: number;
  /** Waiting only: hold the glance toward the input instead of cycling. */
  attentive?: boolean;
  accessibilityLabel?: string;
};

const FILLS: Record<LociPaint, string> = {
  1: PALETTE.loci.base,
  2: PALETTE.loci.light,
  3: PALETTE.loci.shade,
  4: PALETTE.loci.eye,
};
const PAINTS: readonly LociPaint[] = [1, 2, 3, 4];
/** Polls twice per frame so a frame change shows within a fraction of a frame; unchanged frames do not re-render. */
const POLL_MS = 1000 / LOCI_FPS / 2;

/** Loci the companion, drawn as pixel rects and animated at 12 fps. All pose and raster decisions live in the model. */
function LociView({ state, size, attentive, accessibilityLabel = 'Loci' }: Props) {
  const reducedMotion = useReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const startedAt = Date.now();
    const timer = setInterval(() => setFrame(frameAt((Date.now() - startedAt) / 1000)), POLL_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const paths = useMemo(
    () => lociPaths(lociGrid(lociPose(state, frameSeconds(frame), { attentive, reducedMotion }))),
    [state, frame, attentive, reducedMotion],
  );
  const rows = lociRows();

  return (
    <Svg
      width={size}
      height={(size * rows) / LOCI_COLS}
      viewBox={`0 0 ${LOCI_COLS} ${rows}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {PAINTS.map((paint) => (paths[paint] ? <Path key={paint} d={paths[paint]} fill={FILLS[paint]} /> : null))}
    </Svg>
  );
}

export const Loci = memo(LociView);
