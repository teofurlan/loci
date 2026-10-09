/** Landmark ids (OSM refs) the user has already walked past. */
export interface VisitedHistory {
  load(): Promise<ReadonlySet<string>>;
  add(ids: string[]): Promise<void>;
}

export class InMemoryVisitedHistory implements VisitedHistory {
  private readonly ids: Set<string>;

  constructor(initial: Iterable<string> = []) {
    this.ids = new Set(initial);
  }

  async load(): Promise<ReadonlySet<string>> {
    return new Set(this.ids);
  }

  async add(ids: string[]): Promise<void> {
    ids.forEach((id) => this.ids.add(id));
  }
}
