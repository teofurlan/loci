/** Orienteering punches are a grid of pins; each control owns a unique pattern. */
export const PUNCH_GRID = 4;

const CELLS = PUNCH_GRID * PUNCH_GRID;
const MIN_PINS = 4;
const MAX_PINS = 7;

const popcount = (mask: number): number => {
  let count = 0;
  for (let m = mask; m > 0; m >>= 1) count += m & 1;
  return count;
};

/**
 * Pin cells (0..15, row-major) for the control with the given zero-based index.
 * Walks a full-period linear congruential sequence over 16-bit masks, so every
 * index gets its own mask, and keeps the masks with 4 to 7 pins.
 */
export function punchPattern(index: number): number[] {
  let mask = 0x2b5f;
  let seen = -1;
  for (;;) {
    mask = (mask * 5 + 1) % 0x10000;
    const pins = popcount(mask);
    if (pins >= MIN_PINS && pins <= MAX_PINS) seen += 1;
    if (seen === index) break;
  }
  return Array.from({ length: CELLS }, (_, cell) => cell).filter((cell) => (mask >> cell) & 1);
}
