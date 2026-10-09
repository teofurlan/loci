import type { SpriteName } from '../model/sprites';

/** UI chrome tokens. Green appears only as `found` (the success state); nature lives in `map` and the sprites. */
export type UiTokens = {
  /** Screen ground on setup, memorize and results. */
  ground: string;
  /** Dialogue boxes, stamps, menu rows and map plates: the paper a sprite sits on. */
  panel: string;
  /** All text and lines on ground or panel. */
  ink: string;
  /** Secondary text. */
  muted: string;
  /** Buttons: the pressable fill. */
  action: string;
  /** Text on an `action` fill (and on a pressed, ink-filled button). */
  onAction: string;
  /** The run screen: a deep, non-black field with its light text. */
  runField: string;
  runText: string;
  /** The success state: found tags, found badges, the found flash. */
  found: string;
};

/** Terrain colors for the recolored OpenFreeMap style. */
export type MapTokens = {
  land: string;
  park: string;
  wood: string;
  water: string;
  road: string;
  /** The inside of wide roads and the dash of railways. */
  roadFill: string;
  building: string;
  boundary: string;
  label: string;
  labelHalo: string;
};

/** Four colors per sprite: [outline, dark, mid, light]; the sprite grids index into this. */
export type SpriteColors = readonly [string, string, string, string];

export type Palette = {
  name: string;
  ui: UiTokens;
  map: MapTokens;
  sprites: Record<SpriteName, SpriteColors>;
};

export type PaletteName = 'a' | 'b' | 'c';

function build(ui: UiTokens, map: MapTokens, kinds: Record<string, SpriteColors>, name: string): Palette {
  const k = (id: string) => kinds[id];
  const outline = ui.ink;
  return {
    name,
    ui,
    map,
    sprites: {
      park: k('park'),
      water: k('water'),
      monument: k('monument'),
      artwork: k('artwork'),
      worship: k('worship'),
      fountain: k('fountain'),
      viewpoint: k('viewpoint'),
      library: k('library'),
      square: k('square'),
      other: k('other'),
      you: k('you'),
      'found-a': [outline, ui.found, ui.found, ui.found],
      'found-b': [outline, ui.found, ui.found, ui.found],
      unknown: [outline, ui.muted, ui.panel, ui.panel],
    },
  };
}

/** A. PICO-8 Day: the PICO-8 16-color palette on a pale sky ground, navy ink, raspberry action. */
const A = build(
  {
    ground: '#D6E4F0',
    panel: '#FFF1E8',
    ink: '#1D2B53',
    muted: '#5F574F',
    action: '#FF004D',
    onAction: '#FFF1E8',
    runField: '#1D2B53',
    runText: '#FFF1E8',
    found: '#00E436',
  },
  {
    land: '#FFF1E8',
    park: '#00E436',
    wood: '#008751',
    water: '#29ADFF',
    road: '#1D2B53',
    roadFill: '#C2C3C7',
    building: '#C2C3C7',
    boundary: '#5F574F',
    label: '#1D2B53',
    labelHalo: '#FFF1E8',
  },
  {
    park: ['#1D2B53', '#AB5236', '#008751', '#00E436'],
    water: ['#1D2B53', '#29ADFF', '#1D2B53', '#FFF1E8'],
    monument: ['#1D2B53', '#5F574F', '#C2C3C7', '#C2C3C7'],
    artwork: ['#1D2B53', '#AB5236', '#FFF1E8', '#FF77A8'],
    worship: ['#1D2B53', '#FF004D', '#FFCCAA', '#AB5236'],
    fountain: ['#1D2B53', '#29ADFF', '#FFF1E8', '#FFF1E8'],
    viewpoint: ['#1D2B53', '#AB5236', '#FFCCAA', '#FFA300'],
    library: ['#1D2B53', '#AB5236', '#FFF1E8', '#FFCCAA'],
    square: ['#1D2B53', '#5F574F', '#C2C3C7', '#FFEC27'],
    other: ['#1D2B53', '#AB5236', '#FFF1E8', '#FFCCAA'],
    you: ['#1D2B53', '#FF004D', '#FFCCAA', '#FFF1E8'],
  },
  'PICO-8 Day',
);

/** B. Sweetie 16 (GrafxKid) on a blue-grey ground, ink #1a1c2c, crimson action. */
const B = build(
  {
    ground: '#94B0C2',
    panel: '#C9D8E1',
    ink: '#1A1C2C',
    muted: '#333C57',
    action: '#B13E53',
    onAction: '#F4F4F4',
    runField: '#1A1C2C',
    runText: '#F4F4F4',
    found: '#38B764',
  },
  {
    land: '#C9D8E1',
    park: '#A7F070',
    wood: '#38B764',
    water: '#41A6F6',
    road: '#1A1C2C',
    roadFill: '#94B0C2',
    building: '#94B0C2',
    boundary: '#566C86',
    label: '#1A1C2C',
    labelHalo: '#F4F4F4',
  },
  {
    park: ['#1A1C2C', '#B13E53', '#38B764', '#A7F070'],
    water: ['#1A1C2C', '#41A6F6', '#3B5DC9', '#73EFF7'],
    monument: ['#1A1C2C', '#566C86', '#94B0C2', '#F4F4F4'],
    artwork: ['#1A1C2C', '#3B5DC9', '#F4F4F4', '#EF7D57'],
    worship: ['#1A1C2C', '#333C57', '#EF7D57', '#B13E53'],
    fountain: ['#1A1C2C', '#41A6F6', '#F4F4F4', '#73EFF7'],
    viewpoint: ['#1A1C2C', '#EF7D57', '#FFCD75', '#FFCD75'],
    library: ['#1A1C2C', '#B13E53', '#F4F4F4', '#FFCD75'],
    square: ['#1A1C2C', '#566C86', '#94B0C2', '#FFCD75'],
    other: ['#1A1C2C', '#B13E53', '#F4F4F4', '#FFCD75'],
    you: ['#1A1C2C', '#3B5DC9', '#FFCD75', '#F4F4F4'],
  },
  'Sweetie 16',
);

/** C. Field Guide: original and earthy. Pale sky ground, soil-brown ink, a strong blue action. */
const C = build(
  {
    ground: '#D8ECF5',
    panel: '#EEF3EA',
    ink: '#3B2A1E',
    muted: '#6B5444',
    action: '#1F5FA8',
    onAction: '#F2F7FA',
    runField: '#2A1D14',
    runText: '#D8ECF5',
    found: '#4FA83D',
  },
  {
    land: '#EFE8D6',
    park: '#7CC25A',
    wood: '#4FA83D',
    water: '#6FAED6',
    road: '#3B2A1E',
    roadFill: '#D9CDB4',
    building: '#C9BBA3',
    boundary: '#6B5444',
    label: '#3B2A1E',
    labelHalo: '#F7F2E4',
  },
  {
    park: ['#3B2A1E', '#7A4B2A', '#4FA83D', '#7CC25A'],
    water: ['#3B2A1E', '#4C9BD3', '#2F78AE', '#BFE3F5'],
    monument: ['#3B2A1E', '#6E6C68', '#A9A9A4', '#CFCFC9'],
    artwork: ['#3B2A1E', '#7A4B2A', '#F5F0E4', '#C4552E'],
    worship: ['#3B2A1E', '#5C2B20', '#E6D5B8', '#A8432F'],
    fountain: ['#3B2A1E', '#4C9BD3', '#E8F2F7', '#E8F2F7'],
    viewpoint: ['#3B2A1E', '#8C5A2B', '#E8C27A', '#D9A441'],
    library: ['#3B2A1E', '#8C3B2A', '#F5F0E4', '#E8D9B5'],
    square: ['#3B2A1E', '#6E6C68', '#A9A9A4', '#D9A441'],
    other: ['#3B2A1E', '#7A4B2A', '#F5F0E4', '#C4552E'],
    you: ['#3B2A1E', '#1F5FA8', '#E8B98F', '#F2F7FA'],
  },
  'Field Guide',
);

export const PALETTES: Record<PaletteName, Palette> = { a: A, b: B, c: C };

/** Dev switch: change this one constant to try another palette. */
export const ACTIVE_PALETTE_NAME: PaletteName = 'a';
export const ACTIVE_PALETTE: Palette = PALETTES[ACTIVE_PALETTE_NAME];

export type TextPair = { name: string; fg: string; bg: string; size: 'body' | 'label' };

/**
 * Every text-on-background pair the UI draws. Body text must reach 4.5:1 and large or chunky labels 3:1.
 * Keep this in step with the components: a new pairing belongs here first.
 */
export function textPairs({ ui, map }: Palette): TextPair[] {
  return [
    { name: 'ink on ground', fg: ui.ink, bg: ui.ground, size: 'body' },
    { name: 'ink on panel', fg: ui.ink, bg: ui.panel, size: 'body' },
    { name: 'muted on ground', fg: ui.muted, bg: ui.ground, size: 'body' },
    { name: 'muted on panel', fg: ui.muted, bg: ui.panel, size: 'body' },
    { name: 'onAction on action', fg: ui.onAction, bg: ui.action, size: 'label' },
    { name: 'onAction on ink (pressed)', fg: ui.onAction, bg: ui.ink, size: 'label' },
    { name: 'runText on runField', fg: ui.runText, bg: ui.runField, size: 'body' },
    { name: 'runField on runText (pressed)', fg: ui.runField, bg: ui.runText, size: 'label' },
    { name: 'ink on found', fg: ui.ink, bg: ui.found, size: 'label' },
    { name: 'map label on land', fg: map.label, bg: map.land, size: 'body' },
    { name: 'map label on halo', fg: map.label, bg: map.labelHalo, size: 'body' },
  ];
}
