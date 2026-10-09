import type { Fix } from '../../domain/types';

/** The slice of an expo-location LocationObject the run needs. */
export type RawLocation = {
  coords: { latitude: number; longitude: number; accuracy: number | null };
  timestamp: number;
};

type FixSink = { recordFix(fix: Fix): readonly number[] };

export function toFix(location: RawLocation): Fix {
  return {
    position: { lat: location.coords.latitude, lng: location.coords.longitude },
    accuracyMeters: location.coords.accuracy ?? Number.POSITIVE_INFINITY,
    timestamp: location.timestamp,
  };
}

/**
 * Feeds a batch of locations (oldest first) to the course store and returns every control newly
 * punched. Accuracy filtering and ended runs are the domain's job: the store ignores both.
 * Background updates arrive in batches, so one batch can punch several controls.
 */
export function applyFixes(sink: FixSink, locations: readonly RawLocation[]): number[] {
  const hits: number[] = [];
  const ordered = [...locations].sort((a, b) => a.timestamp - b.timestamp);
  for (const location of ordered) hits.push(...sink.recordFix(toFix(location)));
  return hits;
}
