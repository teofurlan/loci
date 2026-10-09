import { trackingMode, trackingNotice } from './tracking-mode';

describe('trackingMode', () => {
  it('tracks in the background only when both permissions are granted', () => {
    expect(trackingMode({ foreground: true, background: true })).toBe('background');
  });

  it('falls back to foreground-only without background permission', () => {
    expect(trackingMode({ foreground: true, background: false })).toBe('foreground');
  });

  it('is off without foreground permission, even if background is reported', () => {
    expect(trackingMode({ foreground: false, background: true })).toBe('off');
    expect(trackingMode({ foreground: false, background: false })).toBe('off');
  });
});

describe('trackingNotice', () => {
  it('asks to keep the screen on in the foreground-only fallback', () => {
    expect(trackingNotice('foreground', true)).toMatch(/screen on/i);
  });

  it('points to system settings when location is off', () => {
    expect(trackingNotice('off', false)).toMatch(/settings/i);
  });

  it('shows the searching state until the first fix in background mode', () => {
    expect(trackingNotice('background', false)).toBe('Searching for GPS');
    expect(trackingNotice('background', true)).toBeNull();
  });

  it('keeps the screen-on reminder after the first fix in foreground-only mode', () => {
    expect(trackingNotice('foreground', false)).toMatch(/screen on/i);
  });
});
