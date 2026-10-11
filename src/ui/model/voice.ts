/** The subset of expo-speech's Voice that voice picking needs. */
export type VoiceInfo = {
  identifier: string;
  name: string;
  language: string;
  quality: string;
};

const norm = (language: string) => language.replace('_', '-').toLowerCase();
const base = (language: string) => norm(language).split('-')[0];
const isNetwork = (voice: VoiceInfo) => /network/i.test(`${voice.identifier} ${voice.name}`);

/**
 * Pick the best on-device voice for a language, or undefined to keep the engine default.
 *
 * Rules: voices whose identifier or name says "network" are never used (the walk has no signal);
 * the language must match by base language; an exact locale beats a same-base locale, then Enhanced
 * beats Default, then an explicit "local" voice wins; the remaining tie breaks by identifier.
 */
export function pickVoice(voices: readonly VoiceInfo[], language: string): string | undefined {
  const wanted = norm(language);
  const score = (voice: VoiceInfo) =>
    (norm(voice.language) === wanted ? 4 : 0) +
    (voice.quality === 'Enhanced' ? 2 : 0) +
    (/local/i.test(voice.identifier) ? 1 : 0);
  const candidates = voices.filter((voice) => !isNetwork(voice) && base(voice.language) === base(language));
  candidates.sort((a, b) => score(b) - score(a) || a.identifier.localeCompare(b.identifier));
  return candidates[0]?.identifier;
}
