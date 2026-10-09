import { advanceIndex, MS_PER_CHAR, revealedCount, typedText } from './typewriter';

describe('typewriter timing', () => {
  it('types about 14 characters a second, near speech pace', () => {
    expect(MS_PER_CHAR).toBe(70);
  });

  it('reveals one character per cadence tick', () => {
    expect(revealedCount(0, 10)).toBe(0);
    expect(revealedCount(MS_PER_CHAR - 1, 10)).toBe(0);
    expect(revealedCount(MS_PER_CHAR, 10)).toBe(1);
    expect(revealedCount(MS_PER_CHAR * 4 + 3, 10)).toBe(4);
  });

  it('clamps to the text length and ignores negative time', () => {
    expect(revealedCount(1_000_000, 10)).toBe(10);
    expect(revealedCount(-50, 10)).toBe(0);
    expect(revealedCount(100, 0)).toBe(0);
  });

  it('slices the text by the revealed count', () => {
    expect(typedText('Hello', 0)).toBe('');
    expect(typedText('Hello', 3)).toBe('Hel');
    expect(typedText('Hello', 99)).toBe('Hello');
  });

  it('never splits a surrogate pair', () => {
    expect(typedText('a\u{1F333}b', 2)).toBe('a\u{1F333}');
  });

  it('advances to the next landmark and wraps after the last', () => {
    expect(advanceIndex(0, 3)).toBe(1);
    expect(advanceIndex(2, 3)).toBe(0);
    expect(advanceIndex(0, 1)).toBe(0);
    expect(advanceIndex(0, 0)).toBe(0);
  });
});
