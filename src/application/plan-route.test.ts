import type { RouteIntent } from '../domain/intent';
import { generateLoopCandidates } from '../domain/loop';
import { offsetMeters } from '../domain/geo';
import type { IntentParser, LandmarkSource, StoryGenerator, StoryInput } from '../domain/ports';
import type { Story } from '../domain/story';
import type { Landmark, LatLng, Rng } from '../domain/types';
import { NotEnoughLandmarksError, planRoute, type PlanRouteDeps } from './plan-route';
import { InMemoryVisitedHistory } from './visited-history';

const start: LatLng = { lat: -34.6037, lng: -58.3816 };

function seeded(seed: number): Rng {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const intent: RouteIntent = {
  mode: 'walk',
  targetDistanceMeters: 3000,
  checkpointCount: 5,
  preferences: { preferGreen: false, preferRecognizable: false },
  storyStyle: 'funny',
  notes: '',
};

const candidates = () =>
  generateLoopCandidates({ origin: start, targetDistanceMeters: 3000, count: 5, rng: seeded(1) });

/** One landmark per candidate, `offset` meters north of it. */
const landmarksAt = (offset: number, skip = 0): Landmark[] =>
  candidates()
    .slice(skip)
    .map((c, i) => ({
      id: `node/${i + 1}`,
      name: `Place ${i + 1}`,
      kind: 'monument' as const,
      position: offsetMeters(c, offset, 0),
    }));

function setup(landmarks: Landmark[], overrides: Partial<PlanRouteDeps> = {}) {
  const parsed: string[] = [];
  const radii: number[] = [];
  const storyInputs: StoryInput[] = [];
  const intentParser: IntentParser = {
    async parse(text) {
      parsed.push(text);
      return intent;
    },
  };
  const source: LandmarkSource = {
    async findNear(_center, radius) {
      radii.push(radius);
      return landmarks;
    },
  };
  const stories: StoryGenerator = {
    async generate(input) {
      storyInputs.push(input);
      return { title: 'T', fragments: input.landmarks.map((l) => ({ landmarkId: l.id, text: l.name })) } as Story;
    },
  };
  const deps: PlanRouteDeps = {
    intentParser,
    landmarks: source,
    stories,
    history: new InMemoryVisitedHistory(),
    rng: seeded(1),
    ...overrides,
  };
  return { deps, parsed, radii, storyInputs };
}

describe('planRoute', () => {
  it('returns checkpoints, story, distance and intent for a request', async () => {
    const { deps, parsed, storyInputs } = setup(landmarksAt(50));
    const plan = await planRoute(deps, { start, text: '30 min walk', language: 'es' });

    expect(parsed).toEqual(['30 min walk']);
    expect(plan.checkpoints).toHaveLength(5);
    expect(plan.story.fragments).toHaveLength(5);
    expect(plan.distanceMeters).toBe(3000);
    expect(plan.intent).toEqual(intent);
    expect(storyInputs[0]).toMatchObject({ style: 'funny', language: 'es' });
    expect(storyInputs[0].landmarks).toEqual(plan.checkpoints);
  });

  it('parses an empty request when no free text is given', async () => {
    const { deps, parsed } = setup(landmarksAt(50));
    await planRoute(deps, { start, language: 'en' });
    expect(parsed).toEqual(['']);
  });

  it('queries landmarks once around the start with radius target/pi plus the retry snap', async () => {
    const { deps, radii } = setup(landmarksAt(50));
    await planRoute(deps, { start, language: 'en' });
    expect(radii).toEqual([Math.ceil(3000 / Math.PI + 400)]);
  });

  it('retries selection at 400 m when 250 m leaves candidates unmatched', async () => {
    const landmarks = landmarksAt(320);
    const widened = await planRoute(setup(landmarks).deps, { start, language: 'en' });
    expect(widened.checkpoints.length).toBeGreaterThanOrEqual(3);

    const noRetry = setup(landmarks, { config: { retrySnapRadiusMeters: 250 } }).deps;
    await expect(planRoute(noRetry, { start, language: 'en' })).rejects.toBeInstanceOf(NotEnoughLandmarksError);
  });

  it('keeps the 250 m result when it is complete, without widening', async () => {
    const { deps } = setup(landmarksAt(100));
    const plan = await planRoute(deps, { start, language: 'en' });
    expect(plan.checkpoints.map((c) => c.id)).toEqual(landmarksAt(100).map((l) => l.id));
  });

  it('fails with NotEnoughLandmarksError below 3 checkpoints', async () => {
    const { deps, storyInputs } = setup(landmarksAt(50).slice(0, 2));
    const error = await planRoute(deps, { start, language: 'en' }).catch((e) => e);
    expect(error).toBeInstanceOf(NotEnoughLandmarksError);
    expect(error).toMatchObject({ found: 2, required: 3 });
    expect(storyInputs).toHaveLength(0);
  });

  it('accepts a partial plan with at least 3 checkpoints', async () => {
    const { deps } = setup(landmarksAt(50).slice(0, 3));
    const plan = await planRoute(deps, { start, language: 'en' });
    expect(plan.checkpoints).toHaveLength(3);
  });

  it('propagates landmark source errors untouched', async () => {
    const boom = new Error('429');
    const { deps } = setup([], {
      landmarks: {
        async findNear() {
          throw boom;
        },
      },
    });
    await expect(planRoute(deps, { start, language: 'en' })).rejects.toBe(boom);
  });

  it('mixes in visited landmarks only when history is not empty', async () => {
    // Every candidate has a new landmark at 10 m; the last two also have a visited one at 200 m.
    // With history the new quota (3) runs out, so the last two checkpoints must be the visited ones.
    const visited = candidates()
      .slice(3)
      .map((c, i) => ({
        id: `node/9${i}`,
        name: `Old ${i}`,
        kind: 'monument' as const,
        position: offsetMeters(c, 200, 0),
      }));
    const all = [...landmarksAt(10), ...visited];
    const isVisited = (id: string) => id.startsWith('node/9');

    const noHistory = await planRoute(setup(all).deps, { start, language: 'en' });
    const withHistory = await planRoute(
      setup(all, { history: new InMemoryVisitedHistory(['node/90', 'node/91']) }).deps,
      { start, language: 'en' },
    );

    expect(noHistory.checkpoints.filter((c) => isVisited(c.id))).toHaveLength(0);
    // familiarRatio 0.4 over 5 checkpoints asks for round(5 * 0.4) = 2 familiar landmarks.
    expect(withHistory.checkpoints.filter((c) => isVisited(c.id))).toHaveLength(2);
  });
});
