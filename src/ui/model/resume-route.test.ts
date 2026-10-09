import { resumeRoute } from './resume-route';

describe('resumeRoute', () => {
  it('has nothing to resume without a course', () => {
    expect(resumeRoute('empty')).toBeNull();
  });

  it.each([
    ['memorize', '/memorize'],
    ['run', '/run'],
    ['results', '/results'],
  ] as const)('sends the %s phase back to %s', (phase, href) => {
    expect(resumeRoute(phase)).toBe(href);
  });
});
