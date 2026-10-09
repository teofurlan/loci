import { PALETTE } from '../theme/palette';
import { FADE_STEP_MS, fadeSequence } from './palette-fade';

describe('palette fade', () => {
  it('steps through the four shades, lit to ink, in four equal steps', () => {
    const steps = fadeSequence(false);
    expect(steps.map((s) => s.color)).toEqual([PALETTE.lit, PALETTE.ground, PALETTE.shade, PALETTE.ink]);
    expect(steps.every((s) => s.ms === FADE_STEP_MS)).toBe(true);
  });

  it('ends on ink', () => {
    const steps = fadeSequence(false);
    expect(steps[steps.length - 1].color).toBe(PALETTE.ink);
  });

  it('cuts instantly to ink with reduced motion', () => {
    expect(fadeSequence(true)).toEqual([{ color: PALETTE.ink, ms: 0 }]);
  });
});
