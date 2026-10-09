import { haversineMeters } from '../../domain/geo';
import type { RouteMode } from '../../domain/intent';
import type { LatLng } from '../../domain/types';

const PACE_KMH: Record<RouteMode, number> = { walk: 5, run: 9 };

export type WalkingMinutes = {
  /** Minutes of the leg leading to each control, following the printed order. */
  perControl: number[];
  /** The whole loop, including the way back to the start. */
  totalMinutes: number;
};

const minutesFor = (meters: number, mode: RouteMode): number => (meters / 1000 / PACE_KMH[mode]) * 60;

/** Walking time per control on the description sheet, at the pace of the chosen mode. */
export function walkingMinutes(start: LatLng, controls: readonly LatLng[], mode: RouteMode): WalkingMinutes {
  if (controls.length === 0) return { perControl: [], totalMinutes: 0 };
  let from = start;
  let meters = 0;
  const perControl = controls.map((control) => {
    const leg = haversineMeters(from, control);
    meters += leg;
    from = control;
    return Math.max(1, Math.round(minutesFor(leg, mode)));
  });
  meters += haversineMeters(from, start);
  return { perControl, totalMinutes: Math.round(minutesFor(meters, mode)) };
}
