import type { SessionStatus } from '../../domain/session';
import type { LociState } from './loci';

export type ResultsLoci = {
  state: LociState;
  /** What Loci says under itself; it replaces the old "Course complete / ended" headline. */
  line: string;
};

/** Loci celebrates a completed route and waits when the route was ended early with Give up. */
export function resultsLoci(status: SessionStatus): ResultsLoci {
  if (status === 'completed') {
    return { state: 'celebrate', line: 'You finished the route. See you next time.' };
  }
  return { state: 'waiting', line: "We'll walk the rest another day. See you next time." };
}
