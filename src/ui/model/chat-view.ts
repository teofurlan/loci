import type { DictationPhase } from './dictation';
import type { LociState } from './loci';

export type ChatViewInput = {
  /** A plan is being made. */
  busy: boolean;
  /** Any problem notice (dictation, location, planning) is on hand. */
  hasError: boolean;
  dictation: DictationPhase;
  /** The request input has focus. */
  focused: boolean;
  /** The request input holds text. */
  hasText: boolean;
  /** The software keyboard is showing. */
  keyboardOpen: boolean;
};

export type ChatView = {
  lociState: LociState;
  /** Loci glances towards the input. */
  attentive: boolean;
  /** The example chips. */
  examples: boolean;
  /** The dictation button. */
  mic: boolean;
  /** Loci says a problem in the caption slot instead of the caption. */
  message: boolean;
  sendEnabled: boolean;
  sendBusy: boolean;
  inputEditable: boolean;
  /** The short line under Loci, or null while a problem message speaks instead. */
  caption: string | null;
};

const IDLE_CAPTION = 'Where shall we walk today?';
const PLANNING_CAPTION = 'Finding places near you…';
const LISTENING_CAPTION = 'Listening… tap the square to stop';
const STOPPING_CAPTION = 'Finishing…';

/**
 * Decides what the chat home shows. Planning takes over (Loci listens, chips and mic step aside); otherwise Loci
 * waits and turns attentive while the user is writing or dictating. The request is optional, so send stays on.
 */
export function chatView({ busy, hasError, dictation, focused, hasText, keyboardOpen }: ChatViewInput): ChatView {
  const dictating = dictation !== 'idle';
  return {
    lociState: busy ? 'listening' : 'waiting',
    attentive: !busy && (focused || hasText || dictating),
    examples: !busy && !keyboardOpen,
    mic: !busy,
    message: !busy && hasError,
    sendEnabled: !busy,
    sendBusy: busy,
    inputEditable: !busy && !dictating,
    caption: caption(busy, hasError, dictation),
  };
}

function caption(busy: boolean, hasError: boolean, dictation: DictationPhase): string | null {
  if (busy) return PLANNING_CAPTION;
  if (dictation === 'listening') return LISTENING_CAPTION;
  if (dictation === 'stopping') return STOPPING_CAPTION;
  return hasError ? null : IDLE_CAPTION;
}
