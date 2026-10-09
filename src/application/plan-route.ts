import { generateLoopCandidates } from '../domain/loop';
import type { RouteIntent } from '../domain/intent';
import type { IntentParser, LandmarkSource, StoryGenerator } from '../domain/ports';
import { selectCheckpoints } from '../domain/select';
import type { Story } from '../domain/story';
import type { Landmark, LatLng, Rng } from '../domain/types';
import type { VisitedHistory } from './visited-history';

export type PlanRouteConfig = {
  snapRadiusMeters: number;
  /** Wider snap used once when the first pass leaves candidates unmatched. */
  retrySnapRadiusMeters: number;
  minCheckpoints: number;
  /** Share of already-visited landmarks to mix in when the user has history. */
  familiarRatio: number;
};

export const DEFAULT_PLAN_CONFIG: PlanRouteConfig = {
  snapRadiusMeters: 250,
  retrySnapRadiusMeters: 400,
  minCheckpoints: 3,
  familiarRatio: 0.4,
};

export type PlanRouteDeps = {
  intentParser: IntentParser;
  landmarks: LandmarkSource;
  stories: StoryGenerator;
  history: VisitedHistory;
  rng: Rng;
  config?: Partial<PlanRouteConfig>;
};

export type PlanRouteRequest = {
  start: LatLng;
  text?: string;
  language: string;
};

export type RoutePlan = {
  checkpoints: Landmark[];
  story: Story;
  distanceMeters: number;
  intent: RouteIntent;
};

export class NotEnoughLandmarksError extends Error {
  constructor(
    readonly found: number,
    readonly required: number,
  ) {
    super(`Only ${found} landmarks found nearby, at least ${required} are needed`);
    this.name = 'NotEnoughLandmarksError';
  }
}

/**
 * Plans a memory route: parse the request, lay out a loop, snap it to real landmarks,
 * and generate the story. Landmark source errors (for example HTTP 429) propagate to the caller.
 */
export async function planRoute(deps: PlanRouteDeps, request: PlanRouteRequest): Promise<RoutePlan> {
  const config = { ...DEFAULT_PLAN_CONFIG, ...deps.config };
  const intent = await deps.intentParser.parse(request.text ?? '');

  const candidates = generateLoopCandidates({
    origin: request.start,
    targetDistanceMeters: intent.targetDistanceMeters,
    count: intent.checkpointCount,
    rng: deps.rng,
  });

  // One fetch covers both snap passes: the loop reaches targetDistance/pi from the start at most.
  const radius = Math.ceil(intent.targetDistanceMeters / Math.PI + config.retrySnapRadiusMeters);
  const landmarks = await deps.landmarks.findNear(request.start, radius);

  const visitedIds = await deps.history.load();
  const select = (snapRadiusMeters: number) =>
    selectCheckpoints({
      candidates,
      landmarks,
      preferences: intent.preferences,
      visitedIds,
      familiarRatio: visitedIds.size > 0 ? config.familiarRatio : 0,
      snapRadiusMeters,
      rng: deps.rng,
    });

  let selected = select(config.snapRadiusMeters);
  if (selected.unmatched > 0) {
    const retry = select(config.retrySnapRadiusMeters);
    if (retry.checkpoints.length > selected.checkpoints.length) selected = retry;
  }

  if (selected.checkpoints.length < config.minCheckpoints) {
    throw new NotEnoughLandmarksError(selected.checkpoints.length, config.minCheckpoints);
  }

  const story = await deps.stories.generate({
    landmarks: selected.checkpoints,
    style: intent.storyStyle,
    language: request.language,
  });

  return {
    checkpoints: selected.checkpoints,
    story,
    distanceMeters: intent.targetDistanceMeters,
    intent,
  };
}
