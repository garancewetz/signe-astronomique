import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ADD_BIRTH_TIME_EVENT,
  MobileCoordinatesModal,
  type CityResult,
  type SearchHistoryEntry,
} from '@/features/natal-input';
import type { CelestialReading, IauConstellation } from '@/features/astronomy';
import type { SelectedBody } from '@/features/space-viewport';
import { ExploreSpacePopover } from '@/features/natal-report';
import { LegendPanel } from '../LegendPanel';
import { MapKey } from '../MapKey';
import { useCockpitDisplay } from '@/context/useCockpitDisplay';
import { InstallPwaPrompt } from './InstallPwaPrompt';
import { BottomSheet, type SheetSnap } from './BottomSheet';
import { MobileHeader } from './MobileHeader';
import { MOBILE_TAB_BAR_OFFSET, MobileTabBar, type MobileTabKey } from './MobileTabBar';
import { MobileSheetContent } from './MobileSheetContent';
import { MobileMenuContent } from './MobileMenuContent';
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
  /**
   * True while the welcome card is on screen: it already hosts the birth
   * form, so the coordinates modal must not also open behind it — closing
   * the card ("explore the sky") has to land on the sky, not a second form.
   */
  welcomeOpen: boolean;
  selectedBody: SelectedBody | null;
  /** Horoscope sign of the picked body, shown on its card. */
  selectedHoroscope?: IauConstellation;
  onCloseSelection: () => void;

  // Camera fly-to
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  /** The result page (owned by the parent Cockpit). */
  signOpen: boolean;
  onOpenSign: () => void;
  onCloseSign: () => void;
  /** Localized true sign once computed. */
  signLabel: string | null;

  // Active tab is controlled by the parent so shared shell state stays
  // in one place across the desktop and mobile cockpits.
  activeTab: MobileTabKey | null;
  onActiveTabChange: (tab: MobileTabKey | null) => void;

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
 * tracks the active tab, and the tab bar. The true-sign reveal is a
 * modal owned by the parent Cockpit.
 *
 * State owned here:
 *   - `snap`        — current bottom sheet snap point
 *   - `activeTab`   — which tab the sheet is rendering content for
 *   - `coordsOpen`  — coordinates modal visibility
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
  // reading, no share-link in flight and no welcome card (which carries its
  // own form). The initializer only runs once on mount, so dismissing the
  // modal will not re-trigger this branch.
  const [coordsOpen, setCoordsOpen] = useState(
    () => !reading && !hasSharedFromUrl && !props.welcomeOpen,
  );
  // A sign computed elsewhere (the welcome card's form) answers the modal's
  // question too: close it so the sky shows once the result is dismissed.
  const [prevReading, setPrevReading] = useState(reading);
  if (prevReading !== reading) {
    setPrevReading(reading);
    if (reading) setCoordsOpen(false);
  }
  const [legendOpen, setLegendOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const vh = useViewportHeight();
  const { zonesEnabled, sideViewActive } = useCockpitDisplay();

  // "Add my birth time" from the result opens the birth form; the form
  // itself unfolds the time field when it mounts.
  useEffect(() => {
    const open = () => setCoordsOpen(true);
    window.addEventListener(ADD_BIRTH_TIME_EVENT, open);
    return () => window.removeEventListener(ADD_BIRTH_TIME_EVENT, open);
  }, []);
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
    // "Mon thème" is a page of its own and "Naissance" a dialog: neither
    // has sheet content. Any other tab takes over from the result page.
    if (next === 'analysis') {
      onActiveTabChange(null);
      setSnap('peek');
      props.onOpenSign();
      return;
    }
    if (props.signOpen) props.onCloseSign();
    if (next === 'coords') {
      setCoordsOpen(true);
      return;
    }
    if (next === null && props.signOpen) return;
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
        onOpenCoords={() => setCoordsOpen(true)}
      />

      <div className="relative flex-1 min-h-0 select-none touch-manipulation">
        {children}
        <DistanceChip label={distanceLabel && t.distanceFromEarth(distanceLabel)} />
        {reading && zonesEnabled && !sideViewActive && <MapKey placement="bottom-left" />}
      </div>

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        peekPx={peekPx}
        midPx={midPx}
        fullPx={fullPx}
        bottomOffset={MOBILE_TAB_BAR_OFFSET}
        visible={showSheet}
        onClose={sheetHasContext ? handleSheetClose : undefined}
        ariaLabel={t.mobile.cockpit.mainAriaLabel}
      >
        <div id="mobile-sheet" className="h-full">
          {activeTab === 'menu' ? (
            <MobileMenuContent
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
          ) : (
          <MobileSheetContent
            activeTab={activeTab}
            hasReading={hasReading}
            onOpenCoords={() => setCoordsOpen(true)}
            onFlySun={props.onFlySun}
            onFlyMoon={props.onFlyMoon}
            onFlyEarth={props.onFlyEarth}
            selectedBody={selectedBody}
            selectedHoroscope={props.selectedHoroscope}
            onCloseSelection={() => {
              props.onCloseSelection();
              setSnap('peek');
            }}
          />
          )}
        </div>
      </BottomSheet>

      <MobileTabBar
        activeTab={props.signOpen ? 'analysis' : activeTab}
        onTabChange={handleTabChange}
        hasReading={hasReading}
        signLabel={props.signLabel}
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
