import type { StoryGenerator, StoryInput } from '../../domain/ports';
import { templateStory, type Story } from '../../domain/story';

export interface StoryCache {
  get(key: string): Promise<Story | undefined>;
  set(key: string, story: Story): Promise<void>;
}

export class InMemoryStoryCache implements StoryCache {
  private readonly stories = new Map<string, Story>();

  async get(key: string): Promise<Story | undefined> {
    return this.stories.get(key);
  }

  async set(key: string, story: Story): Promise<void> {
    this.stories.set(key, story);
  }
}

export function storyCacheKey({ landmarks, style, language }: StoryInput): string {
  return JSON.stringify([landmarks.map((l) => l.id), style ?? '', language]);
}

/**
 * Always tries the inner generator first, remembers its result, and on failure serves the
 * cached story or a deterministic template. Never throws, so the UI always gets a story.
 */
export class CachedStoryGenerator implements StoryGenerator {
  constructor(
    private readonly inner: StoryGenerator,
    private readonly cache: StoryCache,
  ) {}

  async generate(input: StoryInput): Promise<Story> {
    const key = storyCacheKey(input);
    try {
      const story = await this.inner.generate(input);
      await this.cache.set(key, story).catch(() => undefined);
      return story;
    } catch {
      const cached = await this.cache.get(key).catch(() => undefined);
      return cached ?? templateStory(input.landmarks, input.language);
    }
  }
}
