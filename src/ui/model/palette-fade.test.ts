import { FADE_STEP_MS, mapFadeSequence } from './palette-fade';

describe('map fade', () => {
  it('takes four equal hard steps, each darker than the last', () => {
    const steps = mapFadeSequence(false);
    expect(steps).toHaveLength(4);
    expect(steps.every((s) => s.ms === FADE_STEP_MS)).toBe(true);
    expect(steps.map((s) => s.opacity)).toEqual([0.25, 0.5, 0.75, 1]);
  });

  it('ends fully black so the run starts from a hidden map', () => {
    const steps = mapFadeSequence(false);
    expect(steps[steps.length - 1].opacity).toBe(1);
  });

  it('cuts the map to black at once with reduced motion', () => {
    expect(mapFadeSequence(true)).toEqual([{ opacity: 1, ms: 0 }]);
  });
});
