import {
  describeDictationError,
  dictationReducer,
  INITIAL_DICTATION,
  mergeTranscript,
  type DictationState,
} from './dictation';

const listening = (base = ''): DictationState => dictationReducer(INITIAL_DICTATION, { type: 'start', base });

describe('mergeTranscript', () => {
  it('appends the transcript to existing text with one space', () => {
    expect(mergeTranscript('20 min walk', 'with parks')).toBe('20 min walk with parks');
  });
  it('does not double spaces and trims the result', () => {
    expect(mergeTranscript('  walk  ', '  parks ')).toBe('walk parks');
  });
  it('returns the transcript alone when the field was empty', () => {
    expect(mergeTranscript('', 'easy walk')).toBe('easy walk');
  });
  it('keeps the base when the transcript is empty', () => {
    expect(mergeTranscript('easy walk', '')).toBe('easy walk');
  });
});

describe('dictationReducer', () => {
  it('starts idle with no text', () => {
    expect(INITIAL_DICTATION).toEqual({ phase: 'idle', base: '', text: null, problem: null });
  });

  it('start enters listening and clears any earlier problem', () => {
    const errored = dictationReducer(INITIAL_DICTATION, { type: 'error', code: 'network', message: '' });
    const state = dictationReducer(errored, { type: 'start', base: 'walk' });
    expect(state.phase).toBe('listening');
    expect(state.problem).toBeNull();
    expect(state.base).toBe('walk');
  });

  it('streams interim results into the text without losing the base', () => {
    let state = listening('20 min');
    state = dictationReducer(state, { type: 'result', transcript: 'green', isFinal: false });
    expect(state.text).toBe('20 min green');
    state = dictationReducer(state, { type: 'result', transcript: 'green areas', isFinal: false });
    expect(state.text).toBe('20 min green areas');
    expect(state.base).toBe('20 min');
  });

  it('commits a final result into the base so a later result appends', () => {
    let state = listening('walk');
    state = dictationReducer(state, { type: 'result', transcript: 'by the river', isFinal: true });
    expect(state.text).toBe('walk by the river');
    expect(state.base).toBe('walk by the river');
    state = dictationReducer(state, { type: 'result', transcript: 'and parks', isFinal: false });
    expect(state.text).toBe('walk by the river and parks');
  });

  it('stop moves to stopping and still accepts the trailing final result', () => {
    let state = dictationReducer(listening(), { type: 'stop' });
    expect(state.phase).toBe('stopping');
    state = dictationReducer(state, { type: 'result', transcript: 'easy walk', isFinal: true });
    expect(state.text).toBe('easy walk');
  });

  it('end returns to idle and keeps the dictated text', () => {
    let state = dictationReducer(listening(), { type: 'result', transcript: 'easy walk', isFinal: true });
    state = dictationReducer(state, { type: 'end' });
    expect(state.phase).toBe('idle');
    expect(state.text).toBe('easy walk');
  });

  it('ignores results that arrive while idle', () => {
    const state = dictationReducer(INITIAL_DICTATION, { type: 'result', transcript: 'late', isFinal: true });
    expect(state).toBe(INITIAL_DICTATION);
  });

  it('denied permission shows a recovery and stays idle', () => {
    const state = dictationReducer(INITIAL_DICTATION, { type: 'denied', canAskAgain: false });
    expect(state.phase).toBe('idle');
    expect(state.problem).toEqual({
      kind: 'denied',
      problem: 'Microphone access is off for Loci.',
      recovery: 'Open settings and allow the microphone, or type your request.',
      canAskAgain: false,
    });
  });

  it('an error returns to idle with a mapped problem, and the trailing end keeps it', () => {
    let state = dictationReducer(listening('walk'), { type: 'error', code: 'service-not-allowed', message: '' });
    expect(state.phase).toBe('idle');
    expect(state.problem?.kind).toBe('unavailable');
    expect(state.text).toBeNull();
    state = dictationReducer(state, { type: 'end' });
    expect(state.problem?.kind).toBe('unavailable');
  });

  it('an aborted error is the user stopping, not a problem', () => {
    const state = dictationReducer(listening(), { type: 'error', code: 'aborted', message: '' });
    expect(state.phase).toBe('idle');
    expect(state.problem).toBeNull();
  });

  it('dismiss clears the problem', () => {
    const errored = dictationReducer(INITIAL_DICTATION, { type: 'denied', canAskAgain: true });
    expect(dictationReducer(errored, { type: 'dismiss' }).problem).toBeNull();
  });
});

describe('describeDictationError', () => {
  it.each([
    ['not-allowed', 'denied'],
    ['service-not-allowed', 'unavailable'],
    ['language-not-supported', 'unavailable'],
    ['network', 'network'],
    ['no-speech', 'no-speech'],
    ['speech-timeout', 'no-speech'],
    ['audio-capture', 'failed'],
    ['busy', 'failed'],
    ['client', 'failed'],
    ['unknown', 'failed'],
  ] as const)('maps %s to %s', (code, kind) => {
    expect(describeDictationError(code)?.kind).toBe(kind);
  });

  it('every problem names a recovery and mentions typing still works where relevant', () => {
    const problem = describeDictationError('service-not-allowed');
    expect(problem?.recovery).toMatch(/type/i);
  });

  it('returns null for aborted', () => {
    expect(describeDictationError('aborted')).toBeNull();
  });
});
