import { NotEnoughLandmarksError } from '../../application/plan-route';
import { OverpassHttpError } from '../../adapters/overpass/source';
import { describePlanError } from './errors';

describe('describePlanError', () => {
  it('explains too few landmarks and suggests a longer or different course', () => {
    const d = describePlanError(new NotEnoughLandmarksError(1, 3));
    expect(d.problem).toMatch(/named places/i);
    expect(d.recovery).toMatch(/longer|different/i);
  });

  it('asks to retry shortly on Overpass 429', () => {
    const d = describePlanError(new OverpassHttpError(429));
    expect(d.problem).toMatch(/busy/i);
    expect(d.recovery).toMatch(/shortly|moment|minute/i);
  });

  it('reports other Overpass statuses with the status code', () => {
    expect(describePlanError(new OverpassHttpError(504)).problem).toContain('504');
  });

  it('treats network failures as a connection problem', () => {
    const d = describePlanError(new TypeError('Network request failed'));
    expect(d.problem).toMatch(/connect/i);
    expect(d.recovery).toMatch(/connection|network/i);
  });

  it('treats aborts as a timeout', () => {
    const e = new Error('aborted');
    e.name = 'AbortError';
    expect(describePlanError(e).problem).toMatch(/too long/i);
  });

  it('falls back to a generic message for unknown errors', () => {
    const d = describePlanError('boom');
    expect(d.problem.length).toBeGreaterThan(0);
    expect(d.recovery.length).toBeGreaterThan(0);
  });
});
