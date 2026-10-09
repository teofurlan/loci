import { CachedStoryGenerator, InMemoryStoryCache, LlmIntentParser, LlmStoryGenerator } from '../adapters/llm';
import type { FetchFn } from '../adapters/llm/http';
import { GeminiApiClient } from '../adapters/llm/gemini';
import { OllamaClient } from '../adapters/llm/ollama';
import { DEFAULT_OVERPASS_ENDPOINT, OverpassLandmarkSource } from '../adapters/overpass';
import type { LlmClient } from '../domain/ports';
import type { Rng } from '../domain/types';
import { resolveLlmConfig, type Env } from './config';
import { planRoute, type PlanRouteRequest, type RoutePlan } from './plan-route';
import { InMemoryVisitedHistory, type VisitedHistory } from './visited-history';

export type Services = {
  history: VisitedHistory;
  plan(request: PlanRouteRequest): Promise<RoutePlan>;
};

export type ServiceOptions = {
  history?: VisitedHistory;
  rng?: Rng;
};

const USER_AGENT = 'Loci/0.1 (memory route app)';

function buildLlm(env: Env, fetchFn: FetchFn): LlmClient {
  const config = resolveLlmConfig(env);
  return config.kind === 'gemini'
    ? new GeminiApiClient({ fetch: fetchFn, apiKey: config.apiKey, model: config.model })
    : new OllamaClient({ fetch: fetchFn, baseUrl: config.baseUrl, model: config.model });
}

/** Composition root: wires the real adapters into the use cases. Not unit tested on purpose. */
export function createServices(env: Env, fetchFn: FetchFn, options: ServiceOptions = {}): Services {
  const llm = buildLlm(env, fetchFn);
  const history = options.history ?? new InMemoryVisitedHistory();
  const deps = {
    intentParser: new LlmIntentParser(llm),
    landmarks: new OverpassLandmarkSource({
      fetch: fetchFn,
      endpoint: DEFAULT_OVERPASS_ENDPOINT,
      userAgent: USER_AGENT,
    }),
    stories: new CachedStoryGenerator(new LlmStoryGenerator(llm), new InMemoryStoryCache()),
    history,
    rng: options.rng ?? Math.random,
  };
  return { history, plan: (request) => planRoute(deps, request) };
}
