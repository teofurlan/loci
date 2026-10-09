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
  /** Minor roads, service roads and paths: demoted so only major roads carry full ink. */
  roadMinor: string;
  /** The inside of wide roads and the dash of railways. */
  roadFill: string;
  building: string;
  boundary: string;
  label: string;
  labelHalo: string;
};

/** Four colors per sprite: [outline, shade, base, highlight]; the sprite grids index into this. */
export type SpriteColors = readonly [string, string, string, string];

export type Palette = {
  name: string;
  ui: UiTokens;
  map: MapTokens;
  sprites: Record<SpriteName, SpriteColors>;
};

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
      // Sparkles around a newly earned badge are gold, not green.
      'found-a': [outline, '#EF7D57', '#FFCD75', '#FFCD75'],
      'found-b': [outline, '#EF7D57', '#FFCD75', '#FFCD75'],
      unknown: [outline, ui.muted, ui.panel, ui.panel],
    },
  };
}

/** Sweetie 16 (GrafxKid) on a blue-grey ground, ink #1a1c2c, crimson action. Green is for nature and found only. */
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
    roadMinor: '#333C57',
    roadFill: '#94B0C2',
    building: '#94B0C2',
    boundary: '#566C86',
    label: '#1A1C2C',
    labelHalo: '#F4F4F4',
  },
  {
    park: ['#1A1C2C', '#8A4A3A', '#38B764', '#A7F070'],
    water: ['#1A1C2C', '#3B5DC9', '#41A6F6', '#73EFF7'],
    monument: ['#1A1C2C', '#566C86', '#94B0C2', '#F4F4F4'],
    artwork: ['#1A1C2C', '#B13E53', '#EF7D57', '#FFCD75'],
    worship: ['#1A1C2C', '#B13E53', '#EF7D57', '#FFCD75'],
    fountain: ['#1A1C2C', '#41A6F6', '#94B0C2', '#73EFF7'],
    viewpoint: ['#1A1C2C', '#333C57', '#566C86', '#F4F4F4'],
    library: ['#1A1C2C', '#566C86', '#FFCD75', '#F4F4F4'],
    square: ['#1A1C2C', '#566C86', '#FFCD75', '#F4F4F4'],
    other: ['#1A1C2C', '#B13E53', '#FFCD75', '#F4F4F4'],
    you: ['#1A1C2C', '#B13E53', '#FFCD75', '#3B5DC9'],
  },
  'Sweetie 16',
);

/** The world's one palette. */
export const PALETTE: Palette = B;

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
