import { chatView, type ChatViewInput } from './chat-view';

const IDLE: ChatViewInput = { busy: false, hasError: false, dictation: 'idle', focused: false, hasText: false, keyboardOpen: false };
const view = (patch: Partial<ChatViewInput> = {}) => chatView({ ...IDLE, ...patch });

describe('chatView', () => {
  it('waits, unattentive, with the examples, the mic and the greeting when idle', () => {
    expect(view()).toEqual({
      lociState: 'waiting',
      attentive: false,
      examples: true,
      mic: true,
      message: false,
      sendEnabled: true,
      sendBusy: false,
      inputEditable: true,
      caption: 'Where shall we walk today?',
    });
  });

  it('hides the examples while the keyboard is open and brings them back after', () => {
    expect(view({ keyboardOpen: true }).examples).toBe(false);
    expect(view({ keyboardOpen: true }).mic).toBe(true);
    expect(view({ keyboardOpen: false }).examples).toBe(true);
  });

  it('turns attentive while the input is focused or holds text', () => {
    expect(view({ focused: true }).attentive).toBe(true);
    expect(view({ hasText: true }).attentive).toBe(true);
  });

  it('turns attentive while dictating', () => {
    expect(view({ dictation: 'listening' }).attentive).toBe(true);
    expect(view({ dictation: 'stopping' }).attentive).toBe(true);
  });

  it('listens while planning, hides examples, mic and message, and marks send busy', () => {
    const v = view({ busy: true, hasError: true, focused: true, hasText: true });
    expect(v.lociState).toBe('listening');
    expect(v.attentive).toBe(false);
    expect(v.examples).toBe(false);
    expect(v.mic).toBe(false);
    expect(v.message).toBe(false);
    expect(v.sendEnabled).toBe(false);
    expect(v.sendBusy).toBe(true);
    expect(v.inputEditable).toBe(false);
    expect(v.caption).toBe('Finding places near you…');
  });

  it('shows the message panel after a problem and drops the greeting', () => {
    const v = view({ hasError: true });
    expect(v.message).toBe(true);
    expect(v.examples).toBe(true);
    expect(v.mic).toBe(true);
    expect(v.caption).toBeNull();
  });

  it('keeps send available with an empty request, because the request is optional', () => {
    expect(view({ hasText: false }).sendEnabled).toBe(true);
  });

  it('locks the input while dictation owns the text and says what Loci is doing', () => {
    const listening = view({ dictation: 'listening' });
    expect(listening.inputEditable).toBe(false);
    expect(listening.caption).toBe('Listening… tap the square to stop');
    expect(view({ dictation: 'stopping' }).caption).toBe('Finishing…');
  });

  it('keeps the dictation caption over a problem notice only while dictating', () => {
    expect(view({ dictation: 'listening', hasError: true }).message).toBe(true);
    expect(view({ dictation: 'listening', hasError: true }).caption).toBe('Listening… tap the square to stop');
  });
});
