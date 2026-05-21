import { useCallback, useEffect, useState } from 'react';
import type { CelestialReading } from '@/features/astronomy';
import type { CityResult } from './CityAutocomplete';
import { computeReadingFromForm } from './computeReadingFromForm';
import { buildShareUrl, clearNatalFromUrl, type SharedNatal } from './shareLink';

const SHARE_COPIED_FEEDBACK_MS = 2000;

interface UseShareLinkArgs {
  /** Current form values — sourced from [[useNatalForm]] in the cockpit. */
  date: string;
  time: string;
  city: CityResult;
  /** Whether a reading exists. Gates the share button (we only share computed skies). */
  hasReading: boolean;
  /** Payload decoded from the page URL at mount, if any. Drives auto-jump. */
  sharedFromUrl: SharedNatal | null;
  /**
   * Called once on mount with the reading derived from `sharedFromUrl`.
   * Must be stable across renders (wrap in useCallback) — otherwise the
   * auto-jump effect would re-fire on every parent render.
   */
  onAutoJump: (reading: CelestialReading) => void;
  /** Called with the shared payload so it lands in the recipient's history. */
  onRecordSearch: (entry: { date: string; time: string; city: CityResult }) => void;
}

interface UseShareLinkReturn {
  /** Copy the share URL to the clipboard (falls back to `window.prompt`). */
  handleShareLink: () => Promise<void>;
  /** True for ~2 s after a successful copy — drives the icon + tooltip swap. */
  shareCopied: boolean;
  /** Mirror of `hasReading`, returned for symmetry with the other return fields. */
  canShareLink: boolean;
}

/**
 * Owns the share-link concern: clipboard copy on demand, the brief
 * "copied!" feedback window, and the one-shot URL-to-reading hydration
 * that fires when the page loads with a share-link payload.
 *
 * After consuming the URL we strip the natal params via [[clearNatalFromUrl]]
 * so a refresh doesn't re-trigger the jump and the URL stays clean while
 * the user keeps editing.
 */
export function useShareLink({
  date,
  time,
  city,
  hasReading,
  sharedFromUrl,
  onAutoJump,
  onRecordSearch,
}: UseShareLinkArgs): UseShareLinkReturn {
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!sharedFromUrl) return;
    onAutoJump(computeReadingFromForm(sharedFromUrl));
    onRecordSearch({
      date: sharedFromUrl.date,
      time: sharedFromUrl.time,
      city: sharedFromUrl.city,
    });
    clearNatalFromUrl();
  }, [sharedFromUrl, onAutoJump, onRecordSearch]);

  useEffect(() => {
    if (!shareCopied) return;
    const id = window.setTimeout(
      () => setShareCopied(false),
      SHARE_COPIED_FEEDBACK_MS,
    );
    return () => window.clearTimeout(id);
  }, [shareCopied]);

  const handleShareLink = useCallback(async () => {
    const url = buildShareUrl({ date, time, city });
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
    } catch {
      // Clipboard API blocked (insecure context, permission denied) — fall
      // back to a prompt so the user can still grab the link by hand.
      window.prompt('', url);
    }
  }, [date, time, city]);

  return { handleShareLink, shareCopied, canShareLink: hasReading };
}
