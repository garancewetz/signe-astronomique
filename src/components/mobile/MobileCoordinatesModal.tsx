import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CoordinatesForm } from '../CoordinatesForm';
import type { CityResult } from '../CityAutocomplete';
import type { CelestialReading } from '../../utils/astroEngine';

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
  onBlip: () => void;
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
  onBlip,
}: MobileCoordinatesModalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-coords-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Mes coordonnées de naissance"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-40
                     bg-background/95 backdrop-blur-2xl
                     flex flex-col"
        >
          <header
            className="shrink-0 h-12 px-2 flex items-center gap-2
                       border-b border-border-hud-subtle"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="cockpit-focus grid place-items-center
                         h-9 w-9 rounded
                         text-slate-300/85 hover:text-slate-100
                         hover:bg-violet-500/10 transition-colors"
            >
              <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
            <div className="min-w-0">
              <div className="text-cockpit-xs tracking-cockpit-label uppercase text-accent-label/85">
                Console
              </div>
              <h2 className="text-cockpit-md tracking-cockpit-tight text-accent-title uppercase truncate">
                Mes coordonnées
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
              onBlip={onBlip}
              onJump={(reading) => {
                onJump(reading);
                onClose();
              }}
              className="px-4 py-4 space-y-3.5"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
