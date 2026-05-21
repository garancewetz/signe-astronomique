import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  MobileCoordinatesModal,
  type CityResult,
  type SearchHistoryEntry,
} from '@/features/natal-input';
import type { CelestialReading } from '@/features/astronomy';
import type { SelectedBody } from '@/features/space-viewport';
import {
  ExploreSpacePopover,
  type ReportPanelKey,
} from '@/features/natal-report';
import { LegendPanel } from '../LegendPanel';
import { InstallPwaPrompt } from './InstallPwaPrompt';
import { BottomSheet, type SheetSnap } from './BottomSheet';
import { MobileHeader } from './MobileHeader';
import { MobileTabBar, type MobileTabKey } from './MobileTabBar';
import { MobileSheetContent } from './MobileSheetContent';
import { MobileAnalysisStack } from './MobileAnalysisStack';
import { MobileSystemDrawer } from './MobileSystemDrawer';
import { useT } from '@/context/useLocale';
import { DistanceChip } from '@/ui';

const TOP_CHIP_PX = 44; // header content min-height, excl. safe-area
const TAB_BAR_PX = 60; // h-12 button + py-1.5 (top + bottom flat case)
const SHEET_PEEK_PX = 144; // handle + eyebrow + CTA button
const SHEET_MID_RATIO = 0.55;
// Visible gap kept above the sheet at its tallest snap. Without this, on
// iOS PWA the sheet's top edge ends up under the dynamic island and the
// drag handle becomes unreachable.
const SHEET_TOP_RESERVE_PX = 24;
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

  // Recent searches
  searchHistory: SearchHistoryEntry[];
  onRecordSearch: (entry: { date: string; time: string; city: CityResult }) => void;
  onRemoveSearch: (signature: string) => void;

  // Reading + selection state
  reading: CelestialReading | null;
  /**
   * True when the parent has a pending share-link payload that will
   * hydrate a reading on its own. The auto-opening coordinates modal is
   * suppressed in that case so we don't briefly show the form before the
   * computed sky lands.
   */
  hasSharedFromUrl: boolean;
  selectedBody: SelectedBody | null;
  onCloseSelection: () => void;

  // Camera fly-to
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  // Reveal action (used by ResumePanel)
  onRevealConstellation: () => void;

  // Active tab is controlled by the parent so shared shell state stays
  // in one place across the desktop and mobile cockpits.
  activeTab: MobileTabKey | null;
  onActiveTabChange: (tab: MobileTabKey | null) => void;
  /** Bumps each time a new reading is computed — pulses the Analyse tab. */
  analysisAttention: number;

  // Share link
  onShareLink: () => void;
  shareCopied: boolean;
  canShareLink: boolean;

  // System (drawer + overlays)
  onExportView: () => void;
  exportingView: boolean;
  onExportPdf: () => void;
  exportingPdf: boolean;
  canExportReport: boolean;

  /** Camera-to-Earth distance label, refreshed live from SpaceView. */
  distanceLabel: string | null;
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
 * Selecting a body in the 3D scene pops the sheet from peek to mid via
 * the snap-pop hook below — body info renders contextually in the sheet
 * (no dedicated tab) whenever `selectedBody` is set. All other state
 * lives in the parent Cockpit so desktop and mobile share the same
 * source of truth.
 */
export function MobileCockpit(props: MobileCockpitProps) {
  const t = useT();
  const {
    children,
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
    reading,
    hasSharedFromUrl,
    selectedBody,
    onCloseSelection,
    activeTab,
    onActiveTabChange,
    distanceLabel,
  } = props;

  const [snap, setSnap] = useState<SheetSnap>('peek');
  // Auto-open the coordinates modal on first arrival when there's no
  // reading to display and no share-link in flight — the calc form is the
  // only meaningful first action, so we surface it directly instead of
  // making the user hunt for the CTA. The initializer only runs once on
  // mount, so dismissing the modal will not re-trigger this branch.
  const [coordsOpen, setCoordsOpen] = useState(
    () => !reading && !hasSharedFromUrl,
  );
  const [analysisPanel, setAnalysisPanel] = useState<ReportPanelKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const vh = useViewportHeight();
  const reduceMotion = useReducedMotion();

  const headerRef = useRef<HTMLElement>(null);
  const [headerPx, setHeaderPx] = useState(TOP_CHIP_PX);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderPx(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fullPx = Math.max(240, vh - headerPx - TAB_BAR_PX - SHEET_TOP_RESERVE_PX);
  const midPx = Math.max(SHEET_PEEK_PX + 64, Math.round(vh * SHEET_MID_RATIO));
  const peekPx = SHEET_PEEK_PX;

  const hasReading = reading !== null;
  const hasSelectedBody = selectedBody !== null;
  // Once a reading exists and nothing contextual is active, the home view
  // has nothing useful to surface — the header chip already provides the
  // edit entry point. Drop the whole sheet in that case to free the
  // bottom of the screen.
  const showSheet = !hasReading || activeTab !== null || hasSelectedBody;

  const [prevActiveTab, setPrevActiveTab] = useState<MobileTabKey | null>(activeTab);
  if (prevActiveTab !== activeTab) {
    setPrevActiveTab(activeTab);
    if (prevActiveTab === null && activeTab !== null && snap === 'peek') {
      setSnap('mid');
    }
  }

  // Mirror the snap-pop for body selection: picking a body in the 3D
  // scene is what surfaces the contextual SelectionContent, so the sheet
  // must rise from peek the same way a tab tap would.
  const [prevHasSelectedBody, setPrevHasSelectedBody] = useState(hasSelectedBody);
  if (prevHasSelectedBody !== hasSelectedBody) {
    setPrevHasSelectedBody(hasSelectedBody);
    if (!prevHasSelectedBody && hasSelectedBody && snap === 'peek') {
      setSnap('mid');
    }
  }

  const handleTabChange = (next: MobileTabKey | null) => {
    onActiveTabChange(next);
    if (next !== null && snap === 'peek') {
      setSnap('mid');
    } else if (next === null) {
      // Tapping the active tab is the user's "close the sheet" gesture —
      // without this the sheet stays stuck at mid/full showing the home
      // placeholder, which feels unclosable.
      setSnap('peek');
    }
  };

  // The sheet's X button only makes sense when there's contextual state to
  // dismiss. Without an active tab or body selection, the first-arrival
  // CTA home has nothing to clear and the close affordance would mislead.
  const sheetHasContext = activeTab !== null || hasSelectedBody;
  const handleSheetClose = useCallback(() => {
    setSnap('peek');
    onActiveTabChange(null);
    if (selectedBody) onCloseSelection();
  }, [onActiveTabChange, selectedBody, onCloseSelection]);

  return (
    <div
      id="cockpit-main"
      tabIndex={-1}
      className="fixed inset-0 overflow-hidden bg-background flex flex-col"
    >
      <a href="#cockpit-main" className="skip-to-main">
        {t.cockpit.skipToMain}
      </a>

      <MobileHeader
        ref={headerRef}
        date={date}
        city={city}
        coordsOpen={coordsOpen}
        drawerOpen={drawerOpen}
        onOpenCoords={() => setCoordsOpen(true)}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
      />

      <div className="relative flex-1 min-h-0 select-none touch-manipulation">
        {children}
        <DistanceChip label={distanceLabel} />
      </div>

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        peekPx={peekPx}
        midPx={midPx}
        fullPx={fullPx}
        bottomOffset={SHEET_BOTTOM_OFFSET}
        visible={showSheet}
        onClose={sheetHasContext ? handleSheetClose : undefined}
        ariaLabel={t.mobile.cockpit.mainAriaLabel}
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
        searchHistory={searchHistory}
        onRecordSearch={onRecordSearch}
        onRemoveSearch={onRemoveSearch}
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
        onOpenLegend={() => setLegendOpen(true)}
        onOpenExploreSpace={() => setExploreOpen(true)}
        onShareLink={props.onShareLink}
        shareCopied={props.shareCopied}
        canShareLink={props.canShareLink}
        onExportView={props.onExportView}
        exportingView={props.exportingView}
        onExportPdf={props.onExportPdf}
        exportingPdf={props.exportingPdf}
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
                            pt-[env(safe-area-inset-top,0)]
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

      <InstallPwaPrompt />
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
