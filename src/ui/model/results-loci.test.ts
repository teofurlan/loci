import { resultsLoci } from './results-loci';

describe('resultsLoci', () => {
  it('celebrates a route that was completed', () => {
    expect(resultsLoci('completed')).toEqual({
      state: 'celebrate',
      line: 'You finished the route. See you next time.',
    });
  });

  it('waits when the route was ended with Give up', () => {
    expect(resultsLoci('gave-up')).toEqual({
      state: 'waiting',
      line: "We'll walk the rest another day. See you next time.",
    });
  });

  it('treats a route that is somehow still active as ended early', () => {
    expect(resultsLoci('active').state).toBe('waiting');
  });
});
