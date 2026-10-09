import { useCallback, useEffect, useState } from 'react';
import { MS_PER_CHAR, revealedCount, typedText } from '../model/typewriter';

type Progress = { text: string; count: number };

/**
 * Types `text` out at the shared cadence once `armed`. Arm it on the TTS start event when speech is on,
 * immediately otherwise. Reduced motion shows the whole text at once. A new text starts again from zero.
 */
export function useTypewriter(text: string, armed: boolean, reducedMotion: boolean) {
  const length = Array.from(text).length;
  const [progress, setProgress] = useState<Progress>({ text, count: 0 });
  const count = reducedMotion ? length : progress.text === text ? progress.count : 0;

  useEffect(() => {
    if (!armed || reducedMotion || length === 0) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const next = revealedCount(Date.now() - startedAt, length);
      setProgress({ text, count: next });
      if (next >= length) clearInterval(timer);
    }, MS_PER_CHAR);
    return () => clearInterval(timer);
  }, [text, armed, reducedMotion, length]);

  const skip = useCallback(() => setProgress({ text, count: length }), [text, length]);
  return { shown: typedText(text, count), done: count >= length, skip };
}

/** A square wave for the blinking cursor: always on under reduced motion. */
export function useBlink(reducedMotion: boolean, intervalMs = 500): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => setOn((value) => !value), intervalMs);
    return () => clearInterval(timer);
  }, [reducedMotion, intervalMs]);
  return reducedMotion ? true : on;
}
