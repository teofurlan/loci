import { CELEBRATE_MS, runLociState, type RunLociInput } from './run-loci';

const base: RunLociInput = { hint: 'none', confirming: false, lastPunchAt: null, now: 10_000 };

describe('runLociState', () => {
  it('waits when nothing is happening', () => {
    expect(runLociState(base)).toBe('waiting');
    expect(runLociState({ ...base, hint: 'said' })).toBe('waiting');
  });

  it('listens from the tap until the hint is available', () => {
    expect(runLociState({ ...base, hint: 'requesting' })).toBe('listening');
  });

  it('shows the hint pose while the clue is said', () => {
    expect(runLociState({ ...base, hint: 'saying' })).toBe('hint');
  });

  it('celebrates for three seconds after a punch, then waits', () => {
    expect(CELEBRATE_MS).toBe(3000);
    expect(runLociState({ ...base, lastPunchAt: 9_000 })).toBe('celebrate');
    expect(runLociState({ ...base, lastPunchAt: 10_000 - CELEBRATE_MS + 1 })).toBe('celebrate');
    expect(runLociState({ ...base, lastPunchAt: 10_000 - CELEBRATE_MS })).toBe('waiting');
    expect(runLociState({ ...base, lastPunchAt: 1_000 })).toBe('waiting');
  });

  it('treats a punch a hair ahead of a stale clock as just happened', () => {
    expect(runLociState({ ...base, lastPunchAt: 10_400 })).toBe('celebrate');
  });

  it('celebrates over a hint in progress', () => {
    expect(runLociState({ ...base, hint: 'saying', lastPunchAt: 9_500 })).toBe('celebrate');
    expect(runLociState({ ...base, hint: 'requesting', lastPunchAt: 9_500 })).toBe('celebrate');
  });

  it('waits while the give-up confirmation is shown, whatever else is going on', () => {
    expect(runLociState({ ...base, confirming: true, hint: 'saying' })).toBe('waiting');
    expect(runLociState({ ...base, confirming: true, hint: 'requesting' })).toBe('waiting');
    expect(runLociState({ ...base, confirming: true, lastPunchAt: 9_900 })).toBe('waiting');
  });
});
