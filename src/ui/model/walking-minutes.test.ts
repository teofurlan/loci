import { offsetMeters } from '../../domain/geo';
import type { LatLng } from '../../domain/types';
import { walkingMinutes } from './walking-minutes';

const start: LatLng = { lat: 40, lng: -3 };

describe('walkingMinutes', () => {
  it('gives each control the minutes of the leg that leads to it, at 5 km/h for a walk', () => {
    const a = offsetMeters(start, 500, 0);
    const b = offsetMeters(a, 0, 250);
    const result = walkingMinutes(start, [a, b], 'walk');
    expect(result.perControl).toEqual([6, 3]);
  });

  it('is faster for a run (9 km/h)', () => {
    const a = offsetMeters(start, 900, 0);
    expect(walkingMinutes(start, [a], 'run').perControl).toEqual([6]);
  });

  it('never reports less than one minute for a control', () => {
    const a = offsetMeters(start, 10, 0);
    expect(walkingMinutes(start, [a], 'walk').perControl).toEqual([1]);
  });

  it('totals the loop including the way back to the start', () => {
    const a = offsetMeters(start, 500, 0);
    expect(walkingMinutes(start, [a], 'walk').totalMinutes).toBe(12);
  });

  it('is empty without controls', () => {
    expect(walkingMinutes(start, [], 'walk')).toEqual({ perControl: [], totalMinutes: 0 });
  });
});
