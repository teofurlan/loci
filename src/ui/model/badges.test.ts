import { badgeSlots } from './badges';

const kinds = ['park', 'water', 'monument', 'worship'] as const;

describe('badge slots', () => {
  it('maps found, hinted and missed places to numbered slots', () => {
    const slots = badgeSlots(kinds, new Set([0, 2]), new Set([2]));
    expect(slots).toEqual([
      { index: 0, number: 1, kind: 'park', state: 'found' },
      { index: 1, number: 2, kind: 'water', state: 'missed' },
      { index: 2, number: 3, kind: 'monument', state: 'hinted' },
      { index: 3, number: 4, kind: 'worship', state: 'missed' },
    ]);
  });

  it('never marks a missed place as hinted', () => {
    const slots = badgeSlots(kinds, new Set(), new Set([1]));
    expect(slots[1].state).toBe('missed');
  });

  it('returns no slots for an empty course', () => {
    expect(badgeSlots([], new Set(), new Set())).toEqual([]);
  });
});
