import { KvVisitedHistory, type KeyValueStore } from './kv-visited-history';

class FakeStore implements KeyValueStore {
  data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe('KvVisitedHistory', () => {
  it('starts empty', async () => {
    expect((await new KvVisitedHistory(new FakeStore()).load()).size).toBe(0);
  });

  it('persists ids across instances sharing a store, without duplicates', async () => {
    const store = new FakeStore();
    await new KvVisitedHistory(store).add(['node/1', 'node/2']);
    await new KvVisitedHistory(store).add(['node/2', 'way/3']);
    expect([...(await new KvVisitedHistory(store).load())].sort()).toEqual(['node/1', 'node/2', 'way/3']);
  });

  it('recovers from corrupt stored data', async () => {
    const store = new FakeStore();
    await store.setItem('loci.visited.v1', '{not json');
    const history = new KvVisitedHistory(store);
    expect((await history.load()).size).toBe(0);
    await history.add(['node/1']);
    expect([...(await history.load())]).toEqual(['node/1']);
  });

  it('ignores non-string entries', async () => {
    const store = new FakeStore();
    await store.setItem('loci.visited.v1', JSON.stringify(['node/1', 5, null]));
    expect([...(await new KvVisitedHistory(store).load())]).toEqual(['node/1']);
  });
});
