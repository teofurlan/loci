import { CELLS, type WindowBox } from './chat-layout';

/** The run stage takes 1 to 3 dp per aura cell, always a whole dp. */
export const RUN_CELL_MIN = 1;
export const RUN_CELL_MAX = 3;

/** Side padding of the run screen, dp, each side. */
const SIDE_PAD = 24;
/** Top padding below the status bar plus bottom padding above the navigation bar, dp. */
const VERTICAL_PAD = 24 + 20;
/** Counter and timer, dp. */
const HEADER_ROOM = 84;
/** The tracking notice under Loci, dp. */
const NOTICE_ROOM = 32;
/** The clue (fragment and direction) or Loci's message, dp. */
const MESSAGE_ROOM = 130;
/** Hint button, cost line, Give up and their gaps, dp. */
const BOTTOM_ROOM = 170;

/**
 * dp per aura cell, from the window: everything else on the run screen keeps its room and Loci takes what is left,
 * so the screen fits a 360 x 760 dp phone at font scale 1.0 with a 240 dp stage.
 */
export function runCellDp({ width, height, insetTop, insetBottom }: WindowBox): number {
  const free = height - insetTop - insetBottom - VERTICAL_PAD - HEADER_ROOM - NOTICE_ROOM - MESSAGE_ROOM - BOTTOM_ROOM;
  const cells = Math.floor(Math.min(width - 2 * SIDE_PAD, free) / CELLS);
  return Math.min(RUN_CELL_MAX, Math.max(RUN_CELL_MIN, cells));
}

/** The run stage's side in dp. */
export const runStageSize = (box: WindowBox): number => runCellDp(box) * CELLS;
