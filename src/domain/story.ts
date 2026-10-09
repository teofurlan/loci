import type { Landmark } from './types';

export type StoryFragment = { landmarkId: string; text: string };

export type Story = {
  title: string;
  /** Exactly one fragment per landmark, in route order. */
  fragments: StoryFragment[];
};

type Phrases = { title: string; fragment: (name: string) => string };

const PHRASES: Record<string, Phrases> = {
  es: {
    title: 'Tu ruta de memoria',
    fragment: (name) => `En ${name}, imagina una escena absurda y vívida que no podrás olvidar.`,
  },
  en: {
    title: 'Your memory route',
    fragment: (name) => `At ${name}, picture an absurd, vivid scene you will never forget.`,
  },
};

const phrasesFor = (language: string): Phrases => PHRASES[language.toLowerCase().slice(0, 2)] ?? PHRASES.en;

const MAX_TITLE = 120;
const MAX_FRAGMENT = 600;

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Deterministic story used when the model is unavailable or omits a landmark. */
export function templateStory(landmarks: readonly Landmark[], language: string): Story {
  const phrases = phrasesFor(language);
  return {
    title: phrases.title,
    fragments: landmarks.map((l) => ({ landmarkId: l.id, text: phrases.fragment(l.name) })),
  };
}

/**
 * Validates untrusted model output against the landmarks we actually gave it:
 * unknown ids and duplicates are dropped, missing landmarks get a template fragment,
 * and the result always covers every landmark exactly once, in the given order.
 */
export function normalizeStory(raw: unknown, landmarks: readonly Landmark[], language: string): Story {
  const fallback = templateStory(landmarks, language);
  const obj = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  const known = new Set(landmarks.map((l) => l.id));
  const texts = new Map<string, string>();
  if (Array.isArray(obj.fragments)) {
    for (const item of obj.fragments) {
      if (typeof item !== 'object' || item === null) continue;
      const { landmarkId, text } = item as Record<string, unknown>;
      const clean = cleanText(text, MAX_FRAGMENT);
      if (typeof landmarkId === 'string' && known.has(landmarkId) && clean && !texts.has(landmarkId)) {
        texts.set(landmarkId, clean);
      }
    }
  }

  return {
    title: cleanText(obj.title, MAX_TITLE) || fallback.title,
    fragments: fallback.fragments.map((f) => ({ landmarkId: f.landmarkId, text: texts.get(f.landmarkId) ?? f.text })),
  };
}
