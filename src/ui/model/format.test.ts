import type { Hint } from '../../domain/session';
import { controlsFigure, formatElapsed, formatPoints, hintSentence, SCORING_RULE } from './format';

describe('formatElapsed', () => {
  it('formats minutes and seconds', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(65_000)).toBe('1:05');
    expect(formatElapsed(599_999)).toBe('9:59');
  });
  it('adds hours past one hour', () => {
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
  });
  it('treats negative time as zero', () => {
    expect(formatElapsed(-5)).toBe('0:00');
  });
});

const hint = (compass: Hint['compass'], distanceMeters: number): Hint => ({
  checkpointIndex: 0,
  fragment: 'frag',
  bearingDegrees: 0,
  compass,
  distanceMeters,
});

describe('hintSentence', () => {
  it('speaks the compass point spelled out and rounded meters', () => {
    expect(hintSentence(hint('NE', 243))).toBe('North-east, 240 meters.');
  });
  it('rounds under 100 m to 10 and uses kilometers from 1 km', () => {
    expect(hintSentence(hint('S', 47))).toBe('South, 50 meters.');
    expect(hintSentence(hint('W', 1340))).toBe('West, 1.3 kilometers.');
  });
});

describe('score copy', () => {
  it('prints whole points without a decimal and half points with one', () => {
    expect(formatPoints(3)).toBe('3');
    expect(formatPoints(2.5)).toBe('2.5');
  });

  it('names the controls figure', () => {
    expect(controlsFigure(3, 5)).toBe('3 of 5 controls');
    expect(controlsFigure(1, 1)).toBe('1 of 1 control');
  });

  it('explains the scoring in one line', () => {
    expect(SCORING_RULE).toBe('A control scores 1. After a hint about it, it scores ½.');
  });
});
