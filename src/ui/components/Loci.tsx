import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { LOCI_COLS, lociRows, type LociPaint, type LociState } from '../model/loci';
import { useLociPaths } from '../state/use-loci-paths';
import { PALETTE } from '../theme/palettes';

type Props = {
  state: LociState;
  /** Rendered width in dp; the height follows from the grid's aspect ratio. */
  size: number;
  /** Waiting only: hold the glance toward the input instead of cycling. */
  attentive?: boolean;
  accessibilityLabel?: string;
};

export const LOCI_FILLS: Record<LociPaint, string> = {
  1: PALETTE.loci.base,
  2: PALETTE.loci.light,
  3: PALETTE.loci.shade,
  4: PALETTE.loci.eye,
};
export const LOCI_PAINTS: readonly LociPaint[] = [1, 2, 3, 4];

/** Loci the companion, drawn as pixel rects and animated at 12 fps. All pose and raster decisions live in the model. */
function LociView({ state, size, attentive, accessibilityLabel = 'Loci' }: Props) {
  const paths = useLociPaths(state, attentive);
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
      {LOCI_PAINTS.map((paint) => (paths[paint] ? <Path key={paint} d={paths[paint]} fill={LOCI_FILLS[paint]} /> : null))}
    </Svg>
  );
}

export const Loci = memo(LociView);
