import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Atom, BookOpen, Map, Sparkles, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  CarteBody,
  DonneesBody,
  LectureBody,
  ResumeBody,
  type ReportPanelKey,
} from './RightPanel';
import { Button, cn, surfaceClasses } from '@/components/ui';
import type { CelestialReading } from '@/features/astronomy';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useT } from '@/context/useLocale';

interface TabDef {
  key: ReportPanelKey;
  label: string;
  sublabel: string;
  Icon: LucideIcon;
}

interface AnalysisModalProps {
  open: boolean;
  activeTab: ReportPanelKey;
  onActiveTabChange: (key: ReportPanelKey) => void;
  onClose: () => void;
  reading: CelestialReading | null;

  // ResumeBody
  labelsEnabled: boolean;
  onToggleLabels: () => void;
  onRevealConstellation: () => void;

  // LectureBody
  satellitesEnabled: boolean;
}

/**
 * Centered modal that consolidates the four analysis views (Mon signe,
 * Carte, Lecture, Données) into a single tabbed surface. Replaces the
 * four docked side panels — a single CTA in the sidebar opens it.
 */
export function AnalysisModal({
  open,
  activeTab,
  onActiveTabChange,
  onClose,
  reading,
  labelsEnabled,
  onToggleLabels,
  onRevealConstellation,
  satellitesEnabled,
}: AnalysisModalProps) {
  const t = useT();
  const TABS: readonly TabDef[] = [
    { key: 'resume', ...t.analysis.tabs.resume, Icon: Sparkles },
    { key: 'carte', ...t.analysis.tabs.carte, Icon: Map },
    { key: 'lecture', ...t.analysis.tabs.lecture, Icon: BookOpen },
    { key: 'donnees', ...t.analysis.tabs.donnees, Icon: Atom },
  ];
  const reduceMotion = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (open) closeBtnRef.current?.focus({ preventScroll: true });
  }, [open]);

  const tabIdx = TABS.findIndex((tab) => tab.key === activeTab);

  const handleTabKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const delta = e.key === 'ArrowLeft' ? -1 : 1;
      const next = TABS[(tabIdx + delta + TABS.length) % TABS.length];
      onActiveTabChange(next.key);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="analysis-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center
                     px-4 sm:px-8 sm:py-10
                     pt-[max(1.5rem,env(safe-area-inset-top,0))]
                     pb-[max(1.5rem,env(safe-area-inset-bottom,0))]
                     bg-background/55 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="analysis-modal-title"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 240, damping: 30 }
            }
            className={cn(
              // Fixed dimensions so the modal stays the same size regardless
              // of which tab is active or how tall its content is.
              'relative w-full max-w-5xl h-[85vh]',
              'flex flex-col rounded-lg overflow-hidden',
              surfaceClasses('sheet'),
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <header
              className="flex items-start justify-between gap-3
                         px-5 pt-4 pb-3 border-b border-border-hud"
            >
              <div className="min-w-0">
                <div
                  className="text-cockpit-sm tracking-cockpit-label
                             text-accent-label mb-0.5"
                >
                  {t.analysis.sectionLabel}
                </div>
                <h2
                  id="analysis-modal-title"
                  className="text-cockpit-lg tracking-cockpit-tight text-accent-title"
                >
                  {t.analysis.title}
                </h2>
              </div>
              <Button
                ref={closeBtnRef}
                onClick={onClose}
                variant="outline"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                aria-label={t.analysis.closeAriaLabel}
              >
                <X className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden />
              </Button>
            </header>

            <nav
              role="tablist"
              aria-label={t.analysis.tablistAriaLabel}
              className="flex border-b border-border-hud overflow-x-auto
                         [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            >
              {TABS.map(({ key, label, sublabel, Icon }) => {
                const isActive = key === activeTab;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`analysis-tabpanel-${key}`}
                    id={`analysis-tab-${key}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onActiveTabChange(key)}
                    onKeyDown={handleTabKey}
                    className={cn(
                      'cockpit-focus relative flex-1 min-w-32',
                      'flex items-center justify-center gap-2',
                      'px-3 py-2.5',
                      'text-cockpit-sm tracking-cockpit-caps font-medium',
                      'transition-colors',
                      isActive
                        ? 'text-white bg-violet-500/12'
                        : 'text-slate-300 hover:text-white hover:bg-violet-500/6',
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0"
                      strokeWidth={1.4}
                      aria-hidden
                    />
                    <span className="flex flex-col items-start leading-tight">
                      <span>{label}</span>
                      <span
                        className="text-cockpit-xs tracking-cockpit-label
                                   text-accent-label/70 font-normal normal-case"
                      >
                        {sublabel}
                      </span>
                    </span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-2 -bottom-px h-px bg-cyan-300
                                   shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div
              role="tabpanel"
              id={`analysis-tabpanel-${activeTab}`}
              aria-labelledby={`analysis-tab-${activeTab}`}
              className="flex-1 min-h-0 overflow-y-auto px-4 py-4 text-slate-200"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}
                >
                  {activeTab === 'resume' && (
                    <ResumeBody
                      reading={reading}
                      labelsEnabled={labelsEnabled}
                      onToggleLabels={onToggleLabels}
                      onRevealConstellation={onRevealConstellation}
                    />
                  )}
                  {activeTab === 'carte' && <CarteBody reading={reading} />}
                  {activeTab === 'lecture' && (
                    <LectureBody
                      reading={reading}
                      satellitesEnabled={satellitesEnabled}
                    />
                  )}
                  {activeTab === 'donnees' && <DonneesBody reading={reading} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
