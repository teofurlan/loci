import type { LandmarkKind } from '../../domain/types';

export type BadgeState = 'found' | 'hinted' | 'missed';
export type BadgeSlot = { index: number; number: number; kind: LandmarkKind; state: BadgeState };

/** One badge-case slot per control: earned, earned with a hint, or an empty outline. */
export function badgeSlots(
  kinds: readonly LandmarkKind[],
  visited: ReadonlySet<number>,
  hinted: ReadonlySet<number>,
): BadgeSlot[] {
  return kinds.map((kind, index) => ({
    index,
    number: index + 1,
    kind,
    state: !visited.has(index) ? 'missed' : hinted.has(index) ? 'hinted' : 'found',
  }));
}
