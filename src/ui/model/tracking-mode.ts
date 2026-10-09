export type TrackingMode = 'background' | 'foreground' | 'off';

export function trackingMode(permissions: { foreground: boolean; background: boolean }): TrackingMode {
  if (!permissions.foreground) return 'off';
  return permissions.background ? 'background' : 'foreground';
}

/** The run screen's status line, or null when there is nothing to say. */
export function trackingNotice(mode: TrackingMode, hasFix: boolean): string | null {
  if (mode === 'off') return 'Location is off. Allow it in system settings to punch controls.';
  if (mode === 'foreground') return 'Background location is off. Keep the screen on to punch controls.';
  return hasFix ? null : 'Searching for GPS';
}
