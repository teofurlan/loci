import type { VisitedHistory } from '../../application/visited-history';

/** The slice of a key-value store the history needs; `expo-sqlite/kv-store` satisfies it. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const VISITED_KEY = 'loci.visited.v1';

/** Persists visited landmark ids as a JSON array under one key. */
export class KvVisitedHistory implements VisitedHistory {
  constructor(private readonly store: KeyValueStore) {}

  async load(): Promise<ReadonlySet<string>> {
    const raw = await this.store.getItem(VISITED_KEY);
    if (!raw) return new Set();
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    } catch {
      return new Set();
    }
  }

  async add(ids: string[]): Promise<void> {
    const all = new Set(await this.load());
    ids.forEach((id) => all.add(id));
    await this.store.setItem(VISITED_KEY, JSON.stringify([...all]));
  }
}
