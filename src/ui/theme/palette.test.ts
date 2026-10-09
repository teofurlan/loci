import { contrastRatio, PALETTE, SHADES } from './palette';

const FORBIDDEN = ['#000000', '#FFFFFF', '#F26B1D', '#A3238E'];

describe('LCD palette', () => {
  it('is exactly the four contract shades, darkest first', () => {
    expect(SHADES).toEqual(['#0F380F', '#306230', '#8BAC0F', '#9BBC0F']);
    expect(PALETTE).toEqual({ ink: '#0F380F', shade: '#306230', ground: '#8BAC0F', lit: '#9BBC0F' });
  });

  it('contains no black, white, orange or purple', () => {
    for (const color of FORBIDDEN) expect(SHADES).not.toContain(color);
  });

  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('keeps the text pairings legible: ink on ground and ink on lit, lit and ground on ink', () => {
    expect(contrastRatio(PALETTE.ink, PALETTE.ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.ink, PALETTE.lit)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.lit, PALETTE.ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.ground, PALETTE.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('shows why shade text on ink is forbidden', () => {
    expect(contrastRatio(PALETTE.shade, PALETTE.ink)).toBeLessThan(3);
  });
});
