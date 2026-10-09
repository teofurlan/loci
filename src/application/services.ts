import {
  CachedStoryGenerator,
  CooldownLlmClient,
  InMemoryStoryCache,
  LlmIntentParser,
  LlmStoryGenerator,
} from '../adapters/llm';
import type { FetchFn } from '../adapters/llm/http';
import { ProxyLlmClient } from '../adapters/llm/proxy';
import { OllamaClient } from '../adapters/llm/ollama';
import { DEFAULT_OVERPASS_ENDPOINT, FallbackLandmarkSource, OverpassLandmarkSource } from '../adapters/overpass';
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

/** Public mirrors tried in order when the main Overpass server is overloaded. */
const OVERPASS_MIRRORS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/** A local model that just failed is skipped for this long, so a plan does not wait out two timeouts. */
const LLM_COOLDOWN_MS = 2 * 60_000;

/** Only Ollama is wrapped: a dead local host should be skipped, but each proxy request is tried on its own merits. */
export function buildLlm(env: Env, fetchFn: FetchFn): LlmClient {
  const config = resolveLlmConfig(env);
  if (config.kind === 'proxy') return new ProxyLlmClient({ fetch: fetchFn, baseUrl: config.baseUrl });
  const ollama = new OllamaClient({ fetch: fetchFn, baseUrl: config.baseUrl, model: config.model });
  return new CooldownLlmClient(ollama, { cooldownMs: LLM_COOLDOWN_MS });
}

/** Composition root: wires the real adapters into the use cases. Not unit tested on purpose. */
export function createServices(env: Env, fetchFn: FetchFn, options: ServiceOptions = {}): Services {
  const llm = buildLlm(env, fetchFn);
  const history = options.history ?? new InMemoryVisitedHistory();
  const deps = {
    intentParser: new LlmIntentParser(llm),
    landmarks: new FallbackLandmarkSource(
      [DEFAULT_OVERPASS_ENDPOINT, ...OVERPASS_MIRRORS].map(
        (endpoint) => new OverpassLandmarkSource({ fetch: fetchFn, endpoint, userAgent: USER_AGENT }),
      ),
    ),
    stories: new CachedStoryGenerator(new LlmStoryGenerator(llm), new InMemoryStoryCache()),
    history,
    rng: options.rng ?? Math.random,
  };
  return { history, plan: (request) => planRoute(deps, request) };
}
