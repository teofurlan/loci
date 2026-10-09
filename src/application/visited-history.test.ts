import { InMemoryVisitedHistory } from './visited-history';

describe('InMemoryVisitedHistory', () => {
  it('starts empty, accumulates ids and de-duplicates', async () => {
    const history = new InMemoryVisitedHistory();
    expect((await history.load()).size).toBe(0);
    await history.add(['node/1', 'node/2']);
    await history.add(['node/2', 'way/3']);
    expect([...(await history.load())].sort()).toEqual(['node/1', 'node/2', 'way/3']);
  });

  it('can be seeded', async () => {
    const history = new InMemoryVisitedHistory(['node/9']);
    expect((await history.load()).has('node/9')).toBe(true);
  });
});
