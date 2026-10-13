import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { SignReveal } from './SignReveal';
import { Button, cn, surfaceClasses } from '@/ui';
import type { CelestialReading } from '@/features/astronomy';
import { useFocusTrap } from '@/ui/useFocusTrap';
import { useBodyScrollLock } from '@/ui/useBodyScrollLock';
import { useT } from '@/context/useLocale';

interface SignRevealModalProps {
  open: boolean;
  onClose: () => void;
  reading: CelestialReading | null;
  onRevealConstellation: () => void;
  onShare: () => void;
  shareCopied: boolean;
}

/**
 * Centered dialog that shows the user's true sign right after a
 * calculation. Shared by the desktop and mobile cockpits.
 */
export function SignRevealModal({
  open,
  onClose,
  reading,
  onRevealConstellation,
  onShare,
  shareCopied,
}: SignRevealModalProps) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const visible = open && reading !== null;
  const dialogRef = useFocusTrap<HTMLDivElement>(visible);
  useBodyScrollLock(visible);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) closeBtnRef.current?.focus({ preventScroll: true });
  }, [visible]);

  return (
    <AnimatePresence>
      {open && reading && (
        <motion.div
          key="sign-reveal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center
                     px-4 sm:px-8
                     pt-[max(1rem,env(safe-area-inset-top,0))]
                     pb-[max(1rem,env(safe-area-inset-bottom,0))]
                     bg-background/55 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-reveal-title"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 240, damping: 30 }
            }
            className={cn(
              'relative w-full max-w-lg max-h-full',
              'flex flex-col rounded-lg overflow-hidden',
              surfaceClasses('sheet'),
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-3 px-5 pt-4">
              <h2
                id="sign-reveal-title"
                className="text-cockpit-sm tracking-cockpit-label text-accent-label"
              >
                {t.signReveal.eyebrow}
              </h2>
              <Button
                ref={closeBtnRef}
                onClick={onClose}
                variant="outline"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                aria-label={t.signReveal.closeAriaLabel}
              >
                <X className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden />
              </Button>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 pb-5">
              <SignReveal
                reading={reading}
                onRevealConstellation={onRevealConstellation}
                onShare={onShare}
                shareCopied={shareCopied}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
