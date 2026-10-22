import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { SignReveal } from './SignReveal';
import { Button, cn } from '@/ui';
import { loreShortName, type CelestialReading } from '@/features/astronomy';
import { useT } from '@/context/useLocale';

/** Desktop column width — the cockpit shrinks the sky by as much. */
export const SIGN_PANEL_PX = 448;

interface SignRevealPanelProps {
  open: boolean;
  onClose: () => void;
  reading: CelestialReading | null;
  onRevealConstellation: () => void;
  /** Opens the birth form on the time field (the ascendant needs it). */
  onAddBirthTime: () => void;
  onShare: () => void;
  shareCopied: boolean;
  /** False when the birth time was left out (computed at noon). */
  birthTimeKnown: boolean;
  /**
   * Mobile: a full page that stops above the tab bar (this CSS length), so
   * the tabs stay reachable. Desktop (unset): a column docked on the right.
   */
  bottomOffset?: string;
}

/**
 * Hosts the result. Not a modal: on desktop it is a plain column docked on
 * the right and the cockpit shrinks the sky beside it (SIGN_PANEL_PX); on
 * mobile it is a page of its own between the top edge and the tab bar.
 */
export function SignRevealPanel({
  open,
  onClose,
  reading,
  onRevealConstellation,
  onAddBirthTime,
  onShare,
  shareCopied,
  birthTimeKnown,
  bottomOffset,
}: SignRevealPanelProps) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const visible = open && reading !== null;
  const page = bottomOffset !== undefined;

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  // A new reading starts at the top, not where the last one was scrolled.
  useEffect(() => {
    if (visible) panelRef.current?.scrollTo({ top: 0 });
  }, [visible, reading]);

  const offscreen = page ? { y: '100%' } : { x: '100%' };

  return (
    <AnimatePresence>
      {open && reading && (
        <motion.aside
          key="sign-reveal"
          ref={panelRef}
          aria-labelledby="sign-reveal-title"
          initial={reduceMotion ? { opacity: 0 } : offscreen}
          animate={reduceMotion ? { opacity: 1 } : { x: 0, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : offscreen}
          transition={reduceMotion ? { duration: 0 } : { type: 'tween', duration: 0.28, ease: [0.2, 0, 0, 1] }}
          className={cn(
            'fixed right-0 overflow-y-auto overscroll-contain bg-surface',
            page
              ? 'left-0 top-0 z-30 pt-[env(safe-area-inset-top,0)]'
              : 'top-0 bottom-0 z-40 max-w-full border-l border-border-hud-subtle',
          )}
          style={page ? { bottom: bottomOffset } : { width: SIGN_PANEL_PX }}
        >
          <div className="sticky top-0 z-1 flex items-center justify-between gap-3
                          px-6 h-12 bg-surface border-b border-border-hud-faint">
            <h2
              id="sign-reveal-title"
              className="font-serif text-[15px] font-semibold text-white"
            >
              {t.signReveal.panelTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.signReveal.closeAriaLabel}
              className="cockpit-focus -mr-2 grid place-items-center size-10 rounded
                         text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <div className="px-6 pt-6 pb-6">
            <SignReveal
              reading={reading}
              onRevealConstellation={onRevealConstellation}
              onAddBirthTime={onAddBirthTime}
              onShare={onShare}
              shareCopied={shareCopied}
              birthTimeKnown={birthTimeKnown}
              showAllSignsLink
            />
          </div>
          {/* Always in reach, however far the reader has scrolled: the sky
              is the proof of everything above. */}
          <div className="sticky bottom-0 px-6 py-3 bg-surface border-t border-border-hud-faint">
            <Button
              variant="solid"
              size="lg"
              onClick={onRevealConstellation}
              className="w-full justify-between text-cockpit-lg tracking-normal"
            >
              {t.signReveal.revealCta(loreShortName(reading.trueConstellation))}
              <ArrowRight className="size-4" strokeWidth={1.6} aria-hidden />
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
