import { GLYPH_NAMES, glyphFor, glyphRows } from './glyphs';

describe('glyphs', () => {
  it.each(GLYPH_NAMES)('%s is a rectangular grid in palette range', (name) => {
    const rows = glyphRows(name);
    expect(rows.length).toBeGreaterThan(3);
    for (const row of rows) {
      expect(row).toHaveLength(rows[0].length);
      expect(row).toMatch(/^[.0-3]+$/);
    }
    expect(glyphFor(name).flat().some((p) => p !== null)).toBe(true);
  });

  it('has the cursors, the mic and the unknown mark', () => {
    expect(GLYPH_NAMES).toEqual(expect.arrayContaining(['down', 'right', 'mic', 'stop', 'mark']));
  });
});
