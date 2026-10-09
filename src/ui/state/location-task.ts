import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Vibration } from 'react-native';
import type { LatLng } from '../../domain/types';
import { applyFixes, type RawLocation } from '../model/apply-fixes';
import { createTracker } from '../model/tracker';
import { courseStore } from './course';

export const LOCATION_TASK = 'loci-run-location';

type RunEvent = { position: LatLng | null; punched: boolean };
const listeners = new Set<(event: RunEvent) => void>();

/** The run screen listens here to show the last fix and the punch inversion while it is on screen. */
export function subscribeRunEvents(listener: (event: RunEvent) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** One entry point for both sources: the background task and the foreground watcher. */
export function handleLocations(locations: readonly RawLocation[]) {
  if (locations.length === 0) return;
  const hits = applyFixes(courseStore, locations);
  if (hits.length > 0) {
    // Plain vibration: it plays from the foreground service with the screen off, and it is strong enough for a pocket.
    Vibration.vibrate([0, 250, 120, 250]);
  }
  const last = locations[locations.length - 1];
  const position = { lat: last.coords.latitude, lng: last.coords.longitude };
  listeners.forEach((listener) => listener({ position, punched: hits.length > 0 }));
}

// Must live in the global scope: when the app is woken in the background no screen is mounted.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  handleLocations(data.locations);
});

/** Remembered for this session so a user who chose to keep the screen on is not asked on every course. */
let declined = false;
export const declineBackground = () => {
  declined = true;
};
export const hasDeclinedBackground = () => declined;

export const tracker = createTracker({
  isStarted: () => Location.hasStartedLocationUpdatesAsync(LOCATION_TASK),
  start: () =>
    Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 3,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: 'Loci course running',
        notificationBody: 'Walking your memory route',
        killServiceOnDestroy: true,
      },
    }),
  stop: () => Location.stopLocationUpdatesAsync(LOCATION_TASK),
});

// The task must never outlive the run: completion, give up, reset and a fresh process all land here.
courseStore.subscribe(() => {
  void tracker.reconcile(courseStore.get().phase);
});
void tracker.reconcile(courseStore.get().phase);
