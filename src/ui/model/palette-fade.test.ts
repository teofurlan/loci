import { FADE_STEP_MS, fadeSequence } from './palette-fade';

const GROUND = '#D6E4F0';
const RUN = '#1D2B53';

describe('palette fade', () => {
  it('takes four equal steps from near the ground to the run color', () => {
    const steps = fadeSequence(false, GROUND, RUN);
    expect(steps).toHaveLength(4);
    expect(steps.every((s) => s.ms === FADE_STEP_MS)).toBe(true);
    expect(steps[3].color).toBe(RUN);
    expect(steps[0].color).not.toBe(GROUND);
  });

  it('darkens monotonically toward the run color', () => {
    const red = (hex: string) => parseInt(hex.slice(1, 3), 16);
    const reds = fadeSequence(false, GROUND, RUN).map((s) => red(s.color));
    expect([...reds].sort((a, b) => b - a)).toEqual(reds);
  });

  it('cuts instantly to the run color with reduced motion', () => {
    expect(fadeSequence(true, GROUND, RUN)).toEqual([{ color: RUN, ms: 0 }]);
  });
});
