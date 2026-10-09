import { bearingDegrees, compassLabel, haversineMeters, offsetMeters } from './geo';

describe('haversineMeters', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: -34.6037, lng: -58.3816 };
    expect(haversineMeters(p, p)).toBe(0);
  });

  it('matches Buenos Aires to Montevideo (~203 km)', () => {
    const ba = { lat: -34.6037, lng: -58.3816 };
    const mvd = { lat: -34.9011, lng: -56.1645 };
    expect(haversineMeters(ba, mvd)).toBeGreaterThan(200_000);
    expect(haversineMeters(ba, mvd)).toBeLessThan(207_000);
  });

  it('matches Paris to London (~344 km)', () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const london = { lat: 51.5074, lng: -0.1278 };
    expect(Math.abs(haversineMeters(paris, london) - 343_500)).toBeLessThan(2_000);
  });

  it('is symmetric', () => {
    const a = { lat: 10, lng: 20 };
    const b = { lat: -5, lng: 40 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });

  it('one degree of latitude is about 111.2 km', () => {
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(Math.abs(d - 111_195)).toBeLessThan(100);
  });
});

describe('bearingDegrees and compassLabel', () => {
  const origin = { lat: 40, lng: -3 };

  it('points north, east, south and west', () => {
    expect(bearingDegrees(origin, offsetMeters(origin, 500, 0))).toBeCloseTo(0, 0);
    expect(bearingDegrees(origin, offsetMeters(origin, 0, 500))).toBeCloseTo(90, 0);
    expect(bearingDegrees(origin, offsetMeters(origin, -500, 0))).toBeCloseTo(180, 0);
    expect(bearingDegrees(origin, offsetMeters(origin, 0, -500))).toBeCloseTo(270, 0);
  });

  it('returns a bearing in [0, 360)', () => {
    const b = bearingDegrees(origin, offsetMeters(origin, 10, -500));
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });

  it('maps bearings to an 8-point compass', () => {
    expect(compassLabel(0)).toBe('N');
    expect(compassLabel(44)).toBe('NE');
    expect(compassLabel(90)).toBe('E');
    expect(compassLabel(135)).toBe('SE');
    expect(compassLabel(200)).toBe('S');
    expect(compassLabel(270)).toBe('W');
    expect(compassLabel(315)).toBe('NW');
    expect(compassLabel(359)).toBe('N');
    expect(compassLabel(-45)).toBe('NW');
  });
});
