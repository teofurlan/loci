import { OverpassHttpError } from '../../adapters/overpass/source';
import { NotEnoughLandmarksError } from '../../application/plan-route';

export type PlanErrorDescription = { problem: string; recovery: string };

/** Names what went wrong and what the user can do next. */
export function describePlanError(error: unknown): PlanErrorDescription {
  if (error instanceof NotEnoughLandmarksError) {
    return {
      problem: `Only ${error.found} named places were found around you.`,
      recovery: 'Ask for a longer course or try again from a different spot.',
    };
  }
  if (error instanceof OverpassHttpError) {
    if (error.status === 429) {
      return {
        problem: 'The map data service is busy right now.',
        recovery: 'Retry shortly, in about a minute.',
      };
    }
    return {
      problem: `The map data service answered with error ${error.status}.`,
      recovery: 'Try again in a moment.',
    };
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      problem: 'The map data service took too long to answer.',
      recovery: 'Check your connection and set the course again.',
    };
  }
  if (error instanceof TypeError) {
    return {
      problem: 'Could not connect to the map data service.',
      recovery: 'Check your network connection and set the course again.',
    };
  }
  return {
    problem: 'Something went wrong while setting the course.',
    recovery: 'Try again. If it keeps failing, change the request.',
  };
}
