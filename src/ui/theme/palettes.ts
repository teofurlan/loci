import type { SpriteName } from '../model/sprites';

/**
 * UI chrome tokens: one night scheme on a black ground, shared by every screen. Green is not here: found is gold, and
 * green lives only in the map's parks and woods and the park sprite.
 */
export type UiTokens = {
  /** The black field of every screen, and the fill of boxes, buttons and rows (a box is a line on black, no fill). */
  ground: string;
  /** Messages, labels and body text. */
  text: string;
  /** Secondary text. */
  muted: string;
  /** Decorative box borders: dialogue box, chips, stamps' default, rows. Too soft (about 2.2:1) for a control outline. */
  line: string;
  /** Outlines of interactive controls (secondary buttons); reaches 3:1 on the ground. */
  lineStrong: string;
  /** The one action colour: primary buttons, the selected stamp, number tags, the dialogue pointer. */
  accent: string;
  /** The label on an `accent` fill. */
  onAccent: string;
  /** A pressed or selected button: the light flip of the accent. */
  pressed: string;
  /** The label on a `pressed` fill. */
  onPressed: string;
  /** The aura around Loci, blended over the ground; also the hint direction text. */
  aura: string;
  /** The success state: found badges, found tags, the found flash. */
  found: string;
  /** The label on a `found` fill. */
  onFound: string;
  /** The mist plate a sprite sits on: stamps, map markers, row sprites. */
  plate: string;
  /** Text on a `plate`. */
  onPlate: string;
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

/** Loci the companion: body base, upper-left light, lower-right shade, and the eyes. */
export type LociColors = { base: string; light: string; shade: string; eye: string };

export type Palette = {
  name: string;
  ui: UiTokens;
  map: MapTokens;
  loci: LociColors;
  sprites: Record<SpriteName, SpriteColors>;
};

/** The dark outline every sprite keeps on its mist plate. */
const OUTLINE = '#1A1C2C';

function build(ui: UiTokens, map: MapTokens, kinds: Record<string, SpriteColors>, name: string): Palette {
  const k = (id: string) => kinds[id];
  return {
    name,
    ui,
    map,
    loci: { base: '#9182ac', light: '#a99cc2', shade: '#7a6d97', eye: '#292333' },
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
      museum: k('museum'),
      theatre: k('theatre'),
      playground: k('playground'),
      stadium: k('stadium'),
      statue: k('statue'),
      tower: k('tower'),
      station: k('station'),
      market: k('market'),
      you: k('you'),
      // Sparkles around a newly earned badge are gold, not green.
      'found-a': [OUTLINE, '#EF7D57', '#FFCD75', '#FFCD75'],
      'found-b': [OUTLINE, '#EF7D57', '#FFCD75', '#FFCD75'],
      unknown: [OUTLINE, ui.muted, ui.plate, ui.plate],
    },
  };
}

/** Night: the chat home's black field with lavender text, lines and accent; sprite kinds keep their Sweetie 16 tones. */
const B = build(
  {
    ground: '#000000',
    text: '#cfc8dc',
    muted: '#8f86a3',
    line: '#4a4160',
    lineStrong: '#6e5f92',
    accent: '#6e5f92',
    onAccent: '#ffffff',
    pressed: '#d8ccf2',
    onPressed: '#000000',
    aura: '#d8ccf2',
    found: '#ffcd75',
    onFound: '#000000',
    plate: '#cfc8dc',
    onPlate: '#000000',
  },
  {
    land: '#100d16',
    park: '#16301f',
    wood: '#1f4a2c',
    water: '#173a5e',
    road: '#6e5f92',
    roadMinor: '#3a3250',
    roadFill: '#6e5f92',
    building: '#1d1828',
    boundary: '#4a4160',
    label: '#cfc8dc',
    labelHalo: '#000000',
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
    museum: ['#1A1C2C', '#566C86', '#C9D8E1', '#F4F4F4'],
    theatre: ['#1A1C2C', '#5D275D', '#B13E53', '#EF7D57'],
    playground: ['#1A1C2C', '#29366F', '#3B5DC9', '#FFCD75'],
    stadium: ['#1A1C2C', '#333C57', '#B13E53', '#F4F4F4'],
    statue: ['#1A1C2C', '#8A4A3A', '#EF7D57', '#FFCD75'],
    tower: ['#1A1C2C', '#B13E53', '#F4F4F4', '#FFCD75'],
    station: ['#1A1C2C', '#29366F', '#3B5DC9', '#FFCD75'],
    market: ['#1A1C2C', '#EF7D57', '#F4F4F4', '#FFCD75'],
    you: ['#1A1C2C', '#B13E53', '#FFCD75', '#3B5DC9'],
  },
  'Night',
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
    { name: 'text on ground', fg: ui.text, bg: ui.ground, size: 'body' },
    { name: 'muted on ground', fg: ui.muted, bg: ui.ground, size: 'body' },
    { name: 'aura on ground', fg: ui.aura, bg: ui.ground, size: 'body' },
    { name: 'onAccent on accent', fg: ui.onAccent, bg: ui.accent, size: 'label' },
    { name: 'onPressed on pressed', fg: ui.onPressed, bg: ui.pressed, size: 'label' },
    { name: 'onFound on found', fg: ui.onFound, bg: ui.found, size: 'label' },
    { name: 'onPlate on plate', fg: ui.onPlate, bg: ui.plate, size: 'label' },
    { name: 'map label on land', fg: map.label, bg: map.land, size: 'body' },
    { name: 'map label on halo', fg: map.label, bg: map.labelHalo, size: 'body' },
  ];
}
