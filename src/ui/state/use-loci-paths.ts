import { useEffect, useMemo, useState } from 'react';
import { LOCI_FPS, frameAt, frameSeconds, lociGrid, lociPaths, lociPose, type LociPaint, type LociState } from '../model/loci';
import { useReducedMotion } from './use-reduced-motion';

/** Polls twice per frame so a frame change shows within a fraction of a frame; unchanged frames do not re-render. */
const POLL_MS = 1000 / LOCI_FPS / 2;

/**
 * Loci's run-length path data for the current 12 fps frame. The frame clock lives here so every view of Loci
 * (the bare component and the aura stage) animates the same way. Static under reduced motion.
 */
export function useLociPaths(state: LociState, attentive?: boolean): Partial<Record<LociPaint, string>> {
  const reducedMotion = useReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const startedAt = Date.now();
    const timer = setInterval(() => setFrame(frameAt((Date.now() - startedAt) / 1000)), POLL_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  return useMemo(
    () => lociPaths(lociGrid(lociPose(state, frameSeconds(frame), { attentive, reducedMotion }))),
    [state, frame, attentive, reducedMotion],
  );
}
