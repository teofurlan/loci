/** Which parts of the setup screen show, decided from the planning state alone. */
export type SetupSections = {
  /** The dictation control. */
  mic: boolean;
  /** The example menu. */
  examples: boolean;
  /** The loading box with the animated indicator. */
  loading: boolean;
  /** The error or permission notices. */
  error: boolean;
};

/**
 * While planning is busy, the examples and the mic make way for the loading box, so it sits high on the
 * screen and never under the pinned button. After a failure they come back with the error beside them.
 */
export function setupSections({ busy, hasError }: { busy: boolean; hasError: boolean }): SetupSections {
  return { mic: !busy, examples: !busy, loading: busy, error: !busy && hasError };
}
