import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { pickVoice, type VoiceInfo } from '../model/voice';

const RETRY_MS = 1500;
let cache: VoiceInfo[] | null = null;
let loading: Promise<VoiceInfo[]> | null = null;

/** Android can answer with an empty list right after start, so ask once more after a short delay. */
async function loadVoices(): Promise<VoiceInfo[]> {
  try {
    let voices = await Speech.getAvailableVoicesAsync();
    if (voices.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
      voices = await Speech.getAvailableVoicesAsync();
    }
    return voices;
  } catch {
    return [];
  }
}

function ensureVoices(): Promise<VoiceInfo[]> {
  loading ??= loadVoices().then((voices) => {
    if (voices.length > 0) cache = voices;
    else loading = null; // allow a later screen to try again
    return voices;
  });
  return loading;
}

/**
 * The best offline voice for the story language, or undefined until voices load (speech never waits
 * for it). The plan is always requested in 'en' today, so that is the default.
 */
export function useVoice(language = 'en'): string | undefined {
  const [voices, setVoices] = useState<VoiceInfo[]>(cache ?? []);
  useEffect(() => {
    let live = true;
    void ensureVoices().then((loaded) => live && setVoices(loaded));
    return () => {
      live = false;
    };
  }, []);
  return pickVoice(voices, language);
}
