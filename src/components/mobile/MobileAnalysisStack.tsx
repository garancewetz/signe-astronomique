import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  CartePanel,
  DonneesPanel,
  LecturePanel,
  ResumePanel,
  type ReportPanelKey,
} from '../RightPanel';
import type { CelestialReading } from '../../utils/astroEngine';

interface MobileAnalysisStackProps {
  panel: ReportPanelKey | null;
  onClose: () => void;
  reading: CelestialReading | null;

  // Resume panel
  labelsEnabled: boolean;
  onToggleLabels: () => void;
  onRevealConstellation: () => void;

  // Lecture panel
  satellitesEnabled: boolean;
}

/**
 * Full-screen overlay for the four analysis panels (Mon signe, Carte,
 * Lecture, Données). Reuses the desktop panel components — only the
 * surrounding chrome differs (full-screen slide-up vs. side-docked
 * slide-out). Each panel's own onClose is wired to dismiss the stack.
 */
export function MobileAnalysisStack({
  panel,
  onClose,
  reading,
  labelsEnabled,
  onToggleLabels,
  onRevealConstellation,
  satellitesEnabled,
}: MobileAnalysisStackProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {panel !== null && (
        <motion.div
          key={`mobile-analysis-${panel}`}
          role="dialog"
          aria-modal="true"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-40
                     bg-surface-raised/95 backdrop-blur-2xl"
        >
          <div className="h-full min-h-0 overflow-hidden flex flex-col
                          pb-[env(safe-area-inset-bottom,0)]">
            {panel === 'resume' && (
              <ResumePanel
                reading={reading}
                labelsEnabled={labelsEnabled}
                onToggleLabels={onToggleLabels}
                onRevealConstellation={() => {
                  onClose();
                  onRevealConstellation();
                }}
                onClose={onClose}
              />
            )}
            {panel === 'carte' && (
              <CartePanel reading={reading} onClose={onClose} />
            )}
            {panel === 'lecture' && (
              <LecturePanel
                reading={reading}
                satellitesEnabled={satellitesEnabled}
                onClose={onClose}
              />
            )}
            {panel === 'donnees' && (
              <DonneesPanel reading={reading} onClose={onClose} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
