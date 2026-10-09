/** Recognizer error codes the screen can see (a subset of expo-speech-recognition's). */
export type DictationErrorCode = string;

export type DictationProblemKind = 'denied' | 'unavailable' | 'network' | 'no-speech' | 'failed';

export type DictationProblem = {
  kind: DictationProblemKind;
  problem: string;
  recovery: string;
  /** Only meaningful for `denied`: false means the system will not prompt again. */
  canAskAgain?: boolean;
};

export type DictationPhase = 'idle' | 'listening' | 'stopping';

export type DictationState = {
  phase: DictationPhase;
  /** Field text committed before the current utterance. */
  base: string;
  /** Field text produced by dictation, or null until the first result. */
  text: string | null;
  problem: DictationProblem | null;
};

export type DictationAction =
  | { type: 'start'; base: string }
  | { type: 'stop' }
  | { type: 'result'; transcript: string; isFinal: boolean }
  | { type: 'end' }
  | { type: 'error'; code: DictationErrorCode; message: string }
  | { type: 'denied'; canAskAgain: boolean }
  | { type: 'dismiss' };

export const INITIAL_DICTATION: DictationState = { phase: 'idle', base: '', text: null, problem: null };

/** Joins what was already in the field with a transcript, using single spaces. */
export function mergeTranscript(base: string, transcript: string): string {
  return [base.trim(), transcript.trim()].filter(Boolean).join(' ');
}

const TYPING = 'You can still type your request.';

/** Names what went wrong and what to do next; null when the "error" is the user stopping. */
export function describeDictationError(code: DictationErrorCode): DictationProblem | null {
  switch (code) {
    case 'aborted':
      return null;
    case 'not-allowed':
      return {
        kind: 'denied',
        problem: 'Microphone access is off for Loci.',
        recovery: 'Open settings and allow the microphone, or type your request.',
      };
    case 'service-not-allowed':
    case 'language-not-supported':
      return {
        kind: 'unavailable',
        problem: 'Speech recognition is not available on this device.',
        recovery: `Install or enable a speech service in system settings. ${TYPING}`,
      };
    case 'network':
      return {
        kind: 'network',
        problem: 'Speech recognition could not reach its service.',
        recovery: `Check your connection and tap the mic again. ${TYPING}`,
      };
    case 'no-speech':
    case 'speech-timeout':
      return {
        kind: 'no-speech',
        problem: 'Loci did not hear anything.',
        recovery: `Tap the mic and speak after it says listening. ${TYPING}`,
      };
    default:
      return {
        kind: 'failed',
        problem: 'Dictation stopped because of an error.',
        recovery: `Tap the mic to try again. ${TYPING}`,
      };
  }
}

export function dictationReducer(state: DictationState, action: DictationAction): DictationState {
  switch (action.type) {
    case 'start':
      return { phase: 'listening', base: action.base, text: state.text, problem: null };
    case 'stop':
      return state.phase === 'listening' ? { ...state, phase: 'stopping' } : state;
    case 'result': {
      if (state.phase === 'idle') return state;
      const text = mergeTranscript(state.base, action.transcript);
      return { ...state, text, base: action.isFinal ? text : state.base };
    }
    case 'end':
      return { ...state, phase: 'idle' };
    case 'error':
      return { ...state, phase: 'idle', problem: describeDictationError(action.code) };
    case 'denied':
      return {
        ...state,
        phase: 'idle',
        problem: { ...describeDictationError('not-allowed')!, canAskAgain: action.canAskAgain },
      };
    case 'dismiss':
      return { ...state, problem: null };
  }
}
