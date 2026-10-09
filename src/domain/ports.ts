import type { RouteIntent } from './intent';
import type { Story } from './story';
import type { Landmark, LatLng } from './types';

export interface LandmarkSource {
  findNear(center: LatLng, radiusMeters: number): Promise<Landmark[]>;
}

export type LlmCompletionOptions = { json?: boolean; maxTokens?: number };

/** Minimal text-in/text-out contract for any language model backend. Output is untrusted. */
export interface LlmClient {
  complete(prompt: string, opts?: LlmCompletionOptions): Promise<string>;
}

export interface IntentParser {
  parse(text: string): Promise<RouteIntent>;
}

export type StoryInput = { landmarks: Landmark[]; style?: string; language: string };

export interface StoryGenerator {
  generate(input: StoryInput): Promise<Story>;
}
