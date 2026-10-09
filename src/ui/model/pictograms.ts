import type { LandmarkKind } from '../../domain/types';

/**
 * Control description pictograms: stroked paths on a 24 x 24 grid, drawn with one
 * stroke width and round caps so the set reads as a single family.
 */
export const PICTOGRAMS: Record<LandmarkKind, readonly string[]> = {
  park: [
    'M12 21V13',
    'M12 3C8 3 5.5 6 5.5 9C5.5 12 8 14 12 14C16 14 18.5 12 18.5 9C18.5 6 16 3 12 3Z',
  ],
  water: [
    'M3 9C5 7 7 7 9 9C11 11 13 11 15 9C17 7 19 7 21 9',
    'M3 15C5 13 7 13 9 15C11 17 13 17 15 15C17 13 19 13 21 15',
  ],
  monument: ['M10 21V10L12 3L14 10V21', 'M7 21H17'],
  artwork: ['M4 5H20V19H4Z', 'M4 16L9 11L13 15L16 12L20 16'],
  worship: ['M12 2V7', 'M10 4.5H14', 'M6 21V12L12 7L18 12V21', 'M3 21H21'],
  fountain: [
    'M12 4V11',
    'M12 4C9 5 7 8 6 11',
    'M12 4C15 5 17 8 18 11',
    'M4 14H20',
    'M6 14L8 20H16L18 14',
  ],
  viewpoint: [
    'M2 12C5 7 9 5 12 5C15 5 19 7 22 12C19 17 15 19 12 19C9 19 5 17 2 12Z',
    'M12 9A3 3 0 1 0 12 15A3 3 0 1 0 12 9Z',
  ],
  library: [
    'M4 5H10C11 5 12 6 12 7V20C12 19 11 18 10 18H4Z',
    'M20 5H14C13 5 12 6 12 7V20C12 19 13 18 14 18H20Z',
  ],
  square: ['M4 4H20V20H4Z', 'M8 8H16V16H8Z'],
  other: [
    'M12 21C12 21 5 14.5 5 9.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21Z',
    'M12 7.5A2 2 0 1 0 12 11.5A2 2 0 1 0 12 7.5Z',
  ],
};

export const pictogramFor = (kind: LandmarkKind): readonly string[] => PICTOGRAMS[kind];

/** Dictation controls on the same 24 grid: a microphone, and a stop square while listening. */
export const MIC_PICTOGRAM: readonly string[] = [
  'M9 4.5A3 3 0 0 1 15 4.5V11A3 3 0 0 1 9 11Z',
  'M5.5 11C5.5 14.6 8.4 17.5 12 17.5C15.6 17.5 18.5 14.6 18.5 11',
  'M12 17.5V21',
  'M9 21H15',
];
export const STOP_PICTOGRAM: readonly string[] = ['M7 7H17V17H7Z'];
