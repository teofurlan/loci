import { extractJson } from '../../domain/json';
import type { LlmClient, StoryGenerator, StoryInput } from '../../domain/ports';
import { normalizeStory, type Story } from '../../domain/story';

const LANGUAGE_NAMES: Record<string, string> = { es: 'Spanish', en: 'English', pt: 'Portuguese', fr: 'French' };

export function buildStoryPrompt({ landmarks, style, language }: StoryInput): string {
  const languageName = LANGUAGE_NAMES[language.toLowerCase().slice(0, 2)] ?? language;
  // Only id, name and kind are shared: the model never sees or returns coordinates.
  const stops = landmarks.map((l) => ({ landmarkId: l.id, name: l.name, kind: l.kind }));
  return [
    'You are a memory coach using the method of loci. The user will walk past the places below, in order.',
    'Write one vivid, absurd, sensory mini-image per place so each one is easy to remember, and let the images follow one another like a single story.',
    'Tie every image to the place NAME and KIND (a monument, a park, a fountain...). Use recognizable imagery, not street names or directions.',
    `Write in ${languageName}. The text will be read aloud, so use short natural sentences, no lists, no emojis, no markdown.`,
    'The real place is the memory hook: every fragment must say the NAME of the real place and tie the image to what that place is.',
    style
      ? `Story theme or style requested by the user: ${style}. Weave this theme through every fragment: borrow its characters, ideas and vocabulary, but keep each image vivid and the place unmistakable. The theme decorates the image; it never replaces the place.`
      : 'Story style: playful and surreal.',
    'Each fragment must be 1 to 2 sentences.',
    'Reply with ONLY one JSON object, no prose and no code fences, with exactly this schema:',
    '{ "title": string, "fragments": [ { "landmarkId": string, "text": string } ] }',
    'Include exactly one fragment per place, in the same order, copying each landmarkId exactly as given. Never add places.',
    'Places:',
    JSON.stringify(stops),
  ].join('\n');
}

export class LlmStoryGenerator implements StoryGenerator {
  constructor(private readonly llm: LlmClient) {}

  /** Throws only when the model call itself fails; bad output is repaired with template fragments. */
  async generate(input: StoryInput): Promise<Story> {
    const output = await this.llm.complete(buildStoryPrompt(input), { json: true, maxTokens: 1200 });
    return normalizeStory(extractJson(output), input.landmarks, input.language);
  }
}
