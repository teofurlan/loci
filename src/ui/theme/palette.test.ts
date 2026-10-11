import { contrastRatio, mixHex } from './palette';

describe('color utilities', () => {
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('mixes two colors channel by channel', () => {
    expect(mixHex('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mixHex('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(mixHex('#102030', '#304050', 0.5)).toBe('#203040');
  });

  it('clamps the mix amount', () => {
    expect(mixHex('#102030', '#304050', 7)).toBe('#304050');
    expect(mixHex('#102030', '#304050', -1)).toBe('#102030');
  });
});
