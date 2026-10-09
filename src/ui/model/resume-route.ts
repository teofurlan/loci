import type { CourseState } from './course-store';

export type ResumeHref = '/memorize' | '/run' | '/results';

/**
 * The screen a course in progress belongs on. The Android activity is recreated for some
 * system changes (for example a font size change), which resets navigation to the setup
 * screen while the course itself survives in memory.
 */
export function resumeRoute(phase: CourseState['phase']): ResumeHref | null {
  return phase === 'empty' ? null : `/${phase}`;
}
