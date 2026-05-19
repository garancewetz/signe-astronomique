import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { SpaceViewHandle } from '../components/space/SpaceView';

const REVEAL_LABEL_HOLD_MS = 3000;

interface UseRevealSequenceArgs {
  spaceViewRef: RefObject<SpaceViewHandle | null>;
  bodyLabelsEnabled: boolean;
  setBodyLabelsEnabled: (v: boolean) => void;
}

export interface RevealSequence {
  /**
   * Aim the camera at the Sun, force body labels on for ~3 s so the
   * constellation name is painted on the sphere, then restore the previous
   * labels value.
   */
  revealConstellation: () => void;
}

export function useRevealSequence({
  spaceViewRef,
  bodyLabelsEnabled,
  setBodyLabelsEnabled,
}: UseRevealSequenceArgs): RevealSequence {
  const labelTimerRef = useRef<number | null>(null);
  const labelsRestoreRef = useRef<boolean | null>(null);

  useEffect(
    () => () => {
      if (labelTimerRef.current !== null) window.clearTimeout(labelTimerRef.current);
    },
    [],
  );

  const revealConstellation = useCallback(() => {
    if (labelTimerRef.current !== null) {
      window.clearTimeout(labelTimerRef.current);
      labelTimerRef.current = null;
    }
    labelsRestoreRef.current = bodyLabelsEnabled;
    setBodyLabelsEnabled(true);
    spaceViewRef.current?.flyToSun();
    labelTimerRef.current = window.setTimeout(() => {
      labelTimerRef.current = null;
      if (labelsRestoreRef.current !== null) {
        setBodyLabelsEnabled(labelsRestoreRef.current);
        labelsRestoreRef.current = null;
      }
    }, REVEAL_LABEL_HOLD_MS);
  }, [bodyLabelsEnabled, setBodyLabelsEnabled, spaceViewRef]);

  return { revealConstellation };
}
