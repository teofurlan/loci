const MAP_SHARE = 0.55;
const MIN_MAP = 160;
// Room the description sheet must keep, in dp at font scale 1: the pinned footer, then the sheet header
// plus two full control rows with their story. Text grows with the font scale; the footer mostly does not.
const FOOTER_RESERVE = 130;
const SHEET_RESERVE = 350;

/** Height of the memorize map: 55% of the window, giving way so two story rows stay visible at large fonts. */
export function mapHeight(windowHeight: number, fontScale: number): number {
  const share = windowHeight * MAP_SHARE;
  const room = windowHeight - FOOTER_RESERVE - SHEET_RESERVE * Math.max(1, fontScale);
  return Math.round(Math.max(MIN_MAP, Math.min(share, room)));
}

/** Boxes per punch-card row: one row up to four controls, otherwise two balanced rows. */
export function punchColumns(total: number): number {
  return total <= 4 ? Math.max(1, total) : Math.ceil(total / 2);
}
