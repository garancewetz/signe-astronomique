import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CoordinatesForm } from '../CoordinatesForm';
import type { CityResult } from '../CityAutocomplete';
import type { SearchHistoryEntry } from '../../hooks/useSearchHistory';
import type { CelestialReading } from '@/features/astronomy';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useT } from '../../context/useLocale';

interface MobileCoordinatesModalProps {
  open: boolean;
  onClose: () => void;

  date: string;
  time: string;
  city: CityResult;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCityChange: (v: CityResult) => void;
  onJump: (reading: CelestialReading) => void;

  searchHistory: SearchHistoryEntry[];
  onRecordSearch: (entry: { date: string; time: string; city: CityResult }) => void;
  onRemoveSearch: (signature: string) => void;
}

/**
 * Full-screen birth-coordinates modal. Wraps the shared CoordinatesForm
 * in a mobile-friendly shell (back arrow header + breathing spacing).
 * Closes itself once the user submits — they should land back on the
 * 3D scene to see the result.
 */
export function MobileCoordinatesModal({
  open,
  onClose,
  date,
  time,
  city,
  onDateChange,
  onTimeChange,
  onCityChange,
  onJump,
  searchHistory,
  onRecordSearch,
  onRemoveSearch,
}: MobileCoordinatesModalProps) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const dialogRef = useFocusTrap<HTMLDivElement>(open);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-coords-modal"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t.mobile.coordinatesModal.ariaLabel}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-40
                     bg-background/95 backdrop-blur-2xl
                     flex flex-col"
        >
          <header
            className="shrink-0 px-2 flex items-center gap-2
                       min-h-[calc(3rem+env(safe-area-inset-top,0))]
                       pt-[env(safe-area-inset-top,0)]
                       border-b border-border-hud-subtle"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t.mobile.coordinatesModal.closeAriaLabel}
              className="cockpit-focus grid place-items-center
                         h-9 w-9 rounded
                         text-slate-300/85 hover:text-slate-100
                         hover:bg-violet-500/10 transition-colors"
            >
              <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
            <div className="min-w-0">
              <div className="text-cockpit-xs tracking-cockpit-label uppercase text-accent-label/85">
                {t.mobile.coordinatesModal.sectionLabel}
              </div>
              <h2 className="text-cockpit-md tracking-cockpit-tight text-accent-title uppercase truncate">
                {t.mobile.coordinatesModal.title}
              </h2>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <CoordinatesForm
              date={date}
              time={time}
              city={city}
              onDateChange={onDateChange}
              onTimeChange={onTimeChange}
              onCityChange={onCityChange}
              onJump={(reading) => {
                onJump(reading);
                onClose();
              }}
              history={searchHistory}
              onRecordHistory={onRecordSearch}
              onRemoveHistory={onRemoveSearch}
              className="px-4 py-4 space-y-3.5"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
