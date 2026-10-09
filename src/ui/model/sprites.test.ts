import { FOUND_FRAMES, KIND_SPRITES, SPRITE_NAMES, SPRITE_SIZE, spriteFor, spritePaths, spriteRows } from './sprites';

const ALL_KINDS = ['park', 'water', 'monument', 'artwork', 'worship', 'fountain', 'viewpoint', 'library', 'square', 'other'];

describe('sprite data', () => {
  it.each(SPRITE_NAMES)('%s is exactly 16 x 16 characters of . or 0..3', (name) => {
    const rows = spriteRows(name);
    expect(rows).toHaveLength(SPRITE_SIZE);
    for (const row of rows) {
      expect(row).toHaveLength(SPRITE_SIZE);
      expect(row).toMatch(/^[.0-3]+$/);
    }
  });

  it.each(SPRITE_NAMES)('%s keeps every pixel in palette range 0..3 or transparent', (name) => {
    for (const row of spriteFor(name)) {
      expect(row).toHaveLength(SPRITE_SIZE);
      for (const pixel of row) expect(pixel === null || (pixel >= 0 && pixel <= 3)).toBe(true);
    }
  });

  it('covers every landmark kind', () => {
    expect([...KIND_SPRITES].sort()).toEqual([...ALL_KINDS].sort());
    for (const kind of ALL_KINDS) expect(SPRITE_NAMES).toContain(kind);
  });

  it('has a you sprite and two distinct found frames', () => {
    expect(SPRITE_NAMES).toContain('you');
    expect(FOUND_FRAMES).toHaveLength(2);
    expect(spriteRows(FOUND_FRAMES[0])).not.toEqual(spriteRows(FOUND_FRAMES[1]));
  });

  it('gives every kind sprite an ink outline and visible content', () => {
    for (const kind of ALL_KINDS) {
      const flat = spriteFor(kind as (typeof KIND_SPRITES)[number]).flat();
      expect(flat.filter((p) => p === 0).length).toBeGreaterThan(8);
      expect(flat.filter((p) => p !== null).length).toBeGreaterThan(40);
    }
  });

  it('gives every kind a different picture', () => {
    const keys = new Set(ALL_KINDS.map((k) => spriteRows(k as (typeof KIND_SPRITES)[number]).join('')));
    expect(keys.size).toBe(ALL_KINDS.length);
  });
});

describe('spritePaths', () => {
  it('merges horizontal runs into one rect per run', () => {
    const paths = spritePaths([
      [0, 0, null, 3],
      [null, 1, 1, null],
    ]);
    expect(paths[0]).toBe('M0 0h2v1h-2z');
    expect(paths[3]).toBe('M3 0h1v1h-1z');
    expect(paths[1]).toBe('M1 1h2v1h-2z');
    expect(paths[2]).toBeUndefined();
  });

  it('draws every opaque pixel exactly once', () => {
    const sprite = spriteFor('park');
    const paths = spritePaths(sprite);
    let area = 0;
    for (const d of Object.values(paths)) for (const m of d.matchAll(/h(\d+)v1/g)) area += Number(m[1]);
    expect(area).toBe(sprite.flat().filter((p) => p !== null).length);
  });
});
