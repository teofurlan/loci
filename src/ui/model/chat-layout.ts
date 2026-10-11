import { AURA_SCENE } from './loci-aura';

/** Cells across the aura scene. */
export const CELLS = AURA_SCENE;
/** Loci's stage never gets less than 2 dp or more than 3 dp per cell. */
export const CELL_MIN = 2;
export const CELL_MAX = 3;

/** The keyboard is estimated as this fraction of the window height. */
const KEYBOARD_FRACTION = 0.45;
/** The input bar and its padding, dp. */
const BAR_ROOM = 80;
/** Loci's message under the stage: a few lines of text and an action button, dp. */
const MESSAGE_ROOM = 150;

export type WindowBox = { width: number; height: number; insetTop: number; insetBottom: number };

/**
 * dp per aura cell, decided once from the window so Loci never changes size as the screen changes. It is sized for
 * the worst case: keyboard open, the input bar and a message under the stage all at once. Whole dp keep cells crisp.
 */
export function stageCellDp({ width, height, insetTop, insetBottom }: WindowBox): number {
  const free = height - insetTop - insetBottom - height * KEYBOARD_FRACTION - BAR_ROOM - MESSAGE_ROOM;
  const cells = Math.floor(Math.min(width, free) / CELLS);
  return Math.min(CELL_MAX, Math.max(CELL_MIN, cells));
}

/** The stage's side in dp. */
export const stageSize = (box: WindowBox): number => stageCellDp(box) * CELLS;

/** Room kept for the caption or message slot under the stage, dp. */
export const CAPTION_SLOT = MESSAGE_ROOM;
