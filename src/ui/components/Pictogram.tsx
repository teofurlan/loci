import Svg, { Path } from 'react-native-svg';
import type { LandmarkKind } from '../../domain/types';
import { pictogramFor } from '../model/pictograms';

type Props = { kind: LandmarkKind; size?: number; color: string };

/** One drawn icon per landmark kind: 24 grid, 1.75 stroke, round caps and joins. */
export function Pictogram({ kind, size = 28, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      {pictogramFor(kind).map((d, i) => (
        <Path key={i} d={d} stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
