import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, MoreVertical } from 'lucide-react';
import type { CityResult } from '../CityAutocomplete';
import type { CelestialReading } from '../../utils/astroEngine';
import type { ReportPanelKey } from '../RightPanel';
import type { SelectedBody } from '../space/SpaceView';
import { ExploreSpacePopover } from '../ExploreSpacePopover';
import { LegendPanel } from '../LegendPanel';
import { BottomSheet, type SheetSnap } from './BottomSheet';
import { MobileCoordinatesModal } from './MobileCoordinatesModal';
import { MobileTabBar, type MobileTabKey } from './MobileTabBar';
import { MobileSheetContent } from './MobileSheetContent';
import { MobileAnalysisStack } from './MobileAnalysisStack';
import { MobileSystemDrawer } from './MobileSystemDrawer';
import { fr } from '../../i18n/fr';

const TOP_CHIP_PX = 44;
const TAB_BAR_PX = 60; // h-12 button + py-1.5 (top + bottom flat case)
const SHEET_PEEK_PX = 144; // handle + eyebrow + CTA button
const SHEET_MID_RATIO = 0.55;
// Match the tab bar's `pt-1.5 + h-12 + pb-[max(6px, env(...))]` math, so the
// sheet's lower edge always sits exactly on the tab bar's top edge.
const SHEET_BOTTOM_OFFSET =
  'calc(54px + max(0.375rem, env(safe-area-inset-bottom, 0px)))';

interface MobileCockpitProps {
  /** The 3D canvas content (SpaceView). Rendered full-bleed behind the chrome. */
  children: ReactNode;

  // Coordinates form
  date: string;
  time: string;
  city: CityResult;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCityChange: (v: CityResult) => void;
  onJump: (reading: CelestialReading) => void;

  // Reading + selection state
  reading: CelestialReading | null;
  selectedBody: SelectedBody | null;
  onCloseSelection: () => void;

  // Camera fly-to
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  // Reveal action (used by ResumePanel)
  onRevealConstellation: () => void;

  // Active tab is controlled by the parent so a body-pick from the 3D
  // scene can directly route into the Sélection tab without an effect.
  activeTab: MobileTabKey | null;
  onActiveTabChange: (tab: MobileTabKey | null) => void;
  /** Bumps each time a new reading is computed — pulses the Analyse tab. */
  analysisAttention: number;

  // System (drawer + overlays)
  fullscreenActive: boolean;
  onToggleFullscreen: () => void;
  onExportView: () => void;
  exportingView: boolean;
  onExportReport: () => void;
  exportingReport: boolean;
  canExportReport: boolean;
}

/**
 * Mobile layout shell. Composes a full-bleed canvas, a tappable top chip
 * (opens the coordinates modal), a draggable bottom sheet whose content
 * tracks the active tab, the tab bar, and a full-screen analysis stack
 * that reuses the desktop's report panels.
 *
 * State owned here:
 *   - `snap`        — current bottom sheet snap point
 *   - `activeTab`   — which tab the sheet is rendering content for
 *   - `coordsOpen`  — coordinates modal visibility
 *   - `analysisPanel` — full-screen analysis panel currently pushed (or null)
 *
 * Selecting a body in the 3D scene auto-opens the Sélection tab (via the
 * effect below). All other state lives in the parent Cockpit so that
 * desktop and mobile share the same source of truth.
 */
export function MobileCockpit(props: MobileCockpitProps) {
  const {
    children,
    date,
    time,
    city,
    onDateChange,
    onTimeChange,
    onCityChange,
    onJump,
    reading,
    selectedBody,
    activeTab,
    onActiveTabChange,
  } = props;

  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [coordsOpen, setCoordsOpen] = useState(false);
  const [analysisPanel, setAnalysisPanel] = useState<ReportPanelKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const vh = useViewportHeight();
  const reduceMotion = useReducedMotion();

  const fullPx = Math.max(240, vh - TOP_CHIP_PX - TAB_BAR_PX - 12);
  const midPx = Math.max(SHEET_PEEK_PX + 64, Math.round(vh * SHEET_MID_RATIO));
  const peekPx = SHEET_PEEK_PX;

  const hasReading = reading !== null;
  const hasSelectedBody = selectedBody !== null;

  const [prevActiveTab, setPrevActiveTab] = useState<MobileTabKey | null>(activeTab);
  if (prevActiveTab !== activeTab) {
    setPrevActiveTab(activeTab);
    if (prevActiveTab === null && activeTab !== null && snap === 'peek') {
      setSnap('mid');
    }
  }

  const handleTabChange = (next: MobileTabKey | null) => {
    onActiveTabChange(next);
    if (next !== null && snap === 'peek') {
      setSnap('mid');
    }
  };

  return (
    <div
      id="cockpit-main"
      tabIndex={-1}
      className="fixed inset-0 overflow-hidden bg-background flex flex-col"
    >
      <a href="#cockpit-main" className="skip-to-main">
        {fr.cockpit.skipToMain}
      </a>

      <header
        className="shrink-0 z-10
                   h-11
                   bg-surface-console/55 backdrop-blur-xl
                   border-b border-border-hud-subtle
                   flex items-stretch"
      >
        <button
          type="button"
          onClick={() => setCoordsOpen(true)}
          aria-label={fr.mobile.coordinatesModal.editAriaLabel}
          aria-haspopup="dialog"
          aria-expanded={coordsOpen}
          className="cockpit-focus flex-1 min-w-0
                     flex items-center gap-2 px-3
                     hover:bg-violet-500/10 active:bg-violet-500/15
                     transition-colors text-left"
        >
          <span
            aria-hidden="true"
            className="inline-block size-1.5 rounded-full bg-cyan-300
                       shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]"
          />
          <span className="text-cockpit-sm tracking-cockpit-hud text-accent-title uppercase shrink-0">
            CIEL&nbsp;RÉEL
          </span>
          <span className="text-cockpit-xs text-slate-400 truncate flex-1">
            · {date} · {city.label}
          </span>
          <ChevronDown
            className="size-3.5 shrink-0 text-violet-300/70"
            strokeWidth={1.5}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label={fr.mobile.systemDrawer.openAriaLabel}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          className="cockpit-focus shrink-0 grid place-items-center
                     w-11
                     border-l border-border-hud-faint
                     text-slate-300/85 hover:text-slate-100
                     hover:bg-violet-500/10 transition-colors"
        >
          <MoreVertical className="size-4" strokeWidth={1.5} aria-hidden />
        </button>
      </header>

      <div className="relative flex-1 min-h-0 select-none touch-manipulation">
        {children}
      </div>

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        peekPx={peekPx}
        midPx={midPx}
        fullPx={fullPx}
        bottomOffset={SHEET_BOTTOM_OFFSET}
        ariaLabel="Console mobile"
      >
        <div id="mobile-sheet" className="h-full">
          <MobileSheetContent
            activeTab={activeTab}
            hasReading={hasReading}
            onOpenCoords={() => setCoordsOpen(true)}
            onSelectAnalysisPanel={(p) => setAnalysisPanel(p)}
            onFlySun={props.onFlySun}
            onFlyMoon={props.onFlyMoon}
            onFlyEarth={props.onFlyEarth}
            selectedBody={selectedBody}
            onCloseSelection={() => {
              props.onCloseSelection();
              setSnap('peek');
            }}
          />
        </div>
      </BottomSheet>

      <MobileTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasSelectedBody={hasSelectedBody}
        hasReading={hasReading}
        analysisAttention={props.analysisAttention}
      />

      <MobileCoordinatesModal
        open={coordsOpen}
        onClose={() => setCoordsOpen(false)}
        date={date}
        time={time}
        city={city}
        onDateChange={onDateChange}
        onTimeChange={onTimeChange}
        onCityChange={onCityChange}
        onJump={onJump}
      />

      <MobileAnalysisStack
        panel={analysisPanel}
        onClose={() => setAnalysisPanel(null)}
        reading={reading}
        onRevealConstellation={props.onRevealConstellation}
      />

      <MobileSystemDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fullscreenActive={props.fullscreenActive}
        onToggleFullscreen={props.onToggleFullscreen}
        onOpenLegend={() => setLegendOpen(true)}
        onOpenExploreSpace={() => setExploreOpen(true)}
        onExportView={props.onExportView}
        exportingView={props.exportingView}
        onExportReport={props.onExportReport}
        exportingReport={props.exportingReport}
        canExportReport={props.canExportReport}
      />

      <AnimatePresence>
        {legendOpen && (
          <motion.div
            key="mobile-legend"
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
              <LegendPanel
                variant="inline"
                onClose={() => setLegendOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exploreOpen && (
          <ExploreSpacePopover onClose={() => setExploreOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function useViewportHeight(): number {
  const [vh, setVh] = useState<number>(() =>
    typeof window === 'undefined' ? 800 : window.innerHeight,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return vh;
}
