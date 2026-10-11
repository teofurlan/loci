import { memo, useMemo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { AURA_SCENE, LOCI_OFFSET, auraColors, auraPaths } from '../model/loci-aura';
import type { LociState } from '../model/loci';
import { useLociPaths } from '../state/use-loci-paths';
import { CHAT } from '../theme/theme';
import { LOCI_FILLS, LOCI_PAINTS } from './Loci';

type Props = {
  state: LociState;
  /** Rendered width and height in dp (the scene is square). Use `auraStageSize` for a multiple of 120 so every cell is a whole dp. */
  size: number;
  /** Waiting only: hold the glance toward the input instead of cycling. */
  attentive?: boolean;
  accessibilityLabel?: string;
};

/** Loci in the middle of its static pixel aura, in one SVG: aura rings first, Loci on top. */
function LociStageView({ state, size, attentive, accessibilityLabel = 'Loci' }: Props) {
  const loci = useLociPaths(state, attentive);
  const aura = useMemo(() => {
    const paths = auraPaths();
    const colors = auraColors(CHAT.ground, CHAT.aura);
    return colors.map((fill, index) => ({ level: index + 1, fill, d: paths[index + 1] })).filter((ring) => ring.d);
  }, []);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${AURA_SCENE} ${AURA_SCENE}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {aura.map((ring) => (
        <Path key={ring.level} d={ring.d} fill={ring.fill} />
      ))}
      <G x={LOCI_OFFSET.x} y={LOCI_OFFSET.y}>
        {LOCI_PAINTS.map((paint) => (loci[paint] ? <Path key={paint} d={loci[paint]} fill={LOCI_FILLS[paint]} /> : null))}
      </G>
    </Svg>
  );
}

export const LociStage = memo(LociStageView);
