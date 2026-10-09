import { filledSegments, LOADING_SEGMENTS, SEGMENT_MS } from './loading-bar';

describe('filledSegments', () => {
  it('starts with one segment lit so the bar never looks empty', () => {
    expect(filledSegments(0)).toBe(1);
  });

  it('lights one more segment every SEGMENT_MS', () => {
    expect(filledSegments(SEGMENT_MS)).toBe(2);
    expect(filledSegments(SEGMENT_MS * 3 + 1)).toBe(4);
  });

  it('loops back after the bar is full, so a long load keeps moving', () => {
    expect(filledSegments(SEGMENT_MS * LOADING_SEGMENTS)).toBe(1);
    expect(filledSegments(SEGMENT_MS * (LOADING_SEGMENTS - 1))).toBe(LOADING_SEGMENTS);
  });

  it('shows a full bar for reduced motion', () => {
    expect(filledSegments(0, true)).toBe(LOADING_SEGMENTS);
  });

  it('ignores negative time', () => {
    expect(filledSegments(-500)).toBe(1);
  });
});
