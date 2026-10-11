import { setupSections } from './setup-view';

describe('setupSections', () => {
  it('shows the mic, the examples and no notices when idle', () => {
    expect(setupSections({ busy: false, hasError: false })).toEqual({
      mic: true,
      examples: true,
      loading: false,
      error: false,
    });
  });

  it('swaps the examples and the mic for the loading box while busy', () => {
    expect(setupSections({ busy: true, hasError: false })).toEqual({
      mic: false,
      examples: false,
      loading: true,
      error: false,
    });
  });

  it('restores the examples and the mic and shows the error after a failure', () => {
    expect(setupSections({ busy: false, hasError: true })).toEqual({
      mic: true,
      examples: true,
      loading: false,
      error: true,
    });
  });

  it('never shows an error while a new attempt is running', () => {
    expect(setupSections({ busy: true, hasError: true }).error).toBe(false);
  });
});
