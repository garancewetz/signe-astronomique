import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary';
import { CockpitFallback } from './CockpitFallback';
import { KeyboardHintChip } from './KeyboardHintChip';
import { DistanceChip } from '@/ui';
import { useT } from '@/context/useLocale';
import {
  LIVE_TLE_VALIDITY_MS,
  SpaceView,
  useOrbitalPopulation,
  useRevealSequence,
  type SelectedBody,
  type SpaceViewHandle,
} from '@/features/space-viewport';
import { HudFrame } from './HudFrame';
import { BodyInfoHud } from './BodyInfoHud';
import {
  Sidebar,
  SIDEBAR_COLLAPSED_PX,
  SIDEBAR_EXPANDED_PX,
  type ReportPanelKey,
  type SidebarPanelKey,
} from './sidebar';
import {
  AnalysisModal,
  OffscreenFullReport,
  useExportHandlers,
} from '@/features/natal-report';
import { LegendPanel } from './LegendPanel';
import { useMobileLayout } from '@/ui/useMobileLayout';
import { MobileCockpit } from './mobile/MobileCockpit';
import type { MobileTabKey } from './mobile/MobileTabBar';
import type { CelestialReading } from '@/features/astronomy';
import {
  formatNatalShareText,
  useNatalForm,
  useSearchHistory,
  useShareLink,
} from '@/features/natal-input';
import { CockpitDisplayProvider } from '@/context/CockpitDisplayContext';

export function Cockpit() {
  const isMobile = useMobileLayout();
  const t = useT();

  const [reading, setReading] = useState<CelestialReading | null>(null);

  // The natal form lives at the top of the sidebar (always visible).
  // Only floating panels (body picker, legend) live in activePanel now —
  // analysis content moved to a centered modal opened from the sidebar CTA.
  const [activePanel, setActivePanel] = useState<SidebarPanelKey | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisTab, setAnalysisTab] = useState<ReportPanelKey>('resume');
  const [analysisAttention, setAnalysisAttention] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showGuides, setShowGuides] = useState(false);
  const [bodyLabelsEnabled, setBodyLabelsEnabled] = useState(false);
  const [satellitesEnabled, setSatellitesEnabled] = useState(false);
  const [constellationOverlayEnabled, setConstellationOverlayEnabled] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [selectedBody, setSelectedBody] = useState<SelectedBody | null>(null);
  const [sideViewActive, setSideViewActive] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTabKey | null>(null);
  const [distanceLabel, setDistanceLabel] = useState<string | null>(null);

  const {
    satellites: orbitalSatellites,
    status: orbitalStatus,
    retry: retryOrbital,
  } = useOrbitalPopulation(constellationOverlayEnabled);

  // Live overlay availability — Celestrak TLEs only span ~2 weeks around
  // their epoch. When the natal date wanders far from now, gate the toggle.
  // nowMs is sampled at mount; the 2-week threshold absorbs session drift.
  const [nowMs] = useState(() => Date.now());
  const orbitalAvailable =
    reading == null ||
    Math.abs(reading.input.date.getTime() - nowMs) < LIVE_TLE_VALIDITY_MS;

  // Derived: user intent gated by data validity. Avoids a setState-in-effect
  // round-trip — the user toggle keeps its intent, but downstream consumers
  // see the effective state at render time.
  const constellationOverlayActive = constellationOverlayEnabled && orbitalAvailable;

  const {
    date,
    time,
    city,
    setDate,
    setTime,
    setUserCity,
    sharedFromUrl,
  } = useNatalForm();
  const {
    entries: searchHistory,
    record: recordSearch,
    remove: removeSearch,
  } = useSearchHistory();

  const cockpitRef = useRef<HTMLDivElement>(null);
  const spaceViewRef = useRef<SpaceViewHandle>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);

  const {
    exportingView,
    exportingPdf,
    handleExportView,
    handleExportPdf,
  } = useExportHandlers({ spaceViewRef, fullReportRef, reading });

  useEffect(() => {
    const onFs = () => setFullscreenActive(!!document.fullscreenElement);
    onFs();
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const { revealConstellation } = useRevealSequence({
    spaceViewRef,
    bodyLabelsEnabled,
    setBodyLabelsEnabled,
  });

  /** Open the analysis modal on a given tab (defaults to 'resume'). */
  const openAnalysis = useCallback((tab: ReportPanelKey = 'resume') => {
    setAnalysisTab(tab);
    setAnalysisOpen(true);
  }, []);

  const togglePanel = useCallback(
    (key: SidebarPanelKey) =>
      setActivePanel((prev) => (prev === key ? null : key)),
    [],
  );

  const openLegend = useCallback(() => setActivePanel('legend'), []);

  const closePanel = useCallback(() => setActivePanel(null), []);

  const closeAnalysis = useCallback(() => setAnalysisOpen(false), []);

  /**
   * Body picker callback — drives the desktop's BODY panel and, on mobile,
   * the contextual SelectionContent that surfaces in the bottom sheet.
   */
  const handleBodySelect = useCallback((body: SelectedBody | null) => {
    setSelectedBody(body);
    setSideViewActive(false);
    if (body) {
      setActivePanel('body');
    } else {
      setActivePanel((prev) => (prev === 'body' ? null : prev));
    }
  }, []);

  const clearSelection = useCallback(
    () => handleBodySelect(null),
    [handleBodySelect],
  );

  const flyToSun = useCallback(() => spaceViewRef.current?.flyToSun(), []);
  const flyToMoon = useCallback(() => spaceViewRef.current?.flyToMoon(), []);
  const flyToEarth = useCallback(() => spaceViewRef.current?.flyToEarth(), []);
  const openSummary = useCallback(() => openAnalysis('resume'), [openAnalysis]);
  const handleOpenAnalysis = useCallback(
    () => openAnalysis(),
    [openAnalysis],
  );
  const handleRevealFromModal = useCallback(() => {
    closeAnalysis();
    revealConstellation();
  }, [closeAnalysis, revealConstellation]);
  const toggleSidebarCollapsed = useCallback(
    () => setSidebarCollapsed((v) => !v),
    [],
  );

  // Tracks whether handleJump has ever fired so the "first calc" branch can
  // run exactly once without depending on `reading` — which would otherwise
  // force handleJump to re-memoize on every reading change and re-fire any
  // effect that depends on it (notably the share-link auto-jump).
  const hasCalculatedRef = useRef(false);
  const handleJump = useCallback((r: CelestialReading) => {
    const isFirstCalc = !hasCalculatedRef.current;
    hasCalculatedRef.current = true;
    setReading(r);
    // Pulse the Analyse CTA so the user knows fresh data is ready, without
    // pulling them into the modal — they open it on their own terms.
    setAnalysisAttention((k) => k + 1);
    if (!isFirstCalc) return;
    // First calc only: empty sky, scrub overlays so the user discovers the
    // sphere before any layer is painted on top.
    setShowGuides(false);
    setBodyLabelsEnabled(false);
    setSatellitesEnabled(false);
    setConstellationOverlayEnabled(false);
    setActivePanel(null);
  }, []);

  // Pre-formatted body for the native share sheet. Computed here (rather
  // than inside useShareLink) so the hook stays i18n-free.
  const shareText = useMemo(
    () => formatNatalShareText(date, time, city.label, t.intlLocale),
    [city.label, date, time, t.intlLocale],
  );

  const { handleShareLink, shareCopied, canShareLink } = useShareLink({
    date,
    time,
    city,
    hasReading: !!reading,
    shareText,
    sharedFromUrl,
    onAutoJump: handleJump,
    onRecordSearch: recordSearch,
  });

  const toggleFullscreen = useCallback(() => {
    const el = cockpitRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }, []);

  // Canvas left inset: sidebar width only — body/legend float over the
  // canvas as glassmorphism cards, and the analysis modal is centered.
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;
  const canvasInsetStyle = { left: `${sidebarWidth}px` };

  const toggleBodyLabels = useCallback(
    () => setBodyLabelsEnabled((v) => !v),
    [],
  );
  const toggleGuides = useCallback(() => setShowGuides((v) => !v), []);
  const toggleSatellites = useCallback(
    () => setSatellitesEnabled((v) => !v),
    [],
  );
  const toggleSideView = useCallback(() => setSideViewActive((v) => !v), []);

  const toggleConstellationOverlay = useCallback(() => {
    if (orbitalStatus === 'error') {
      retryOrbital();
      setConstellationOverlayEnabled((v) => v || true);
      return;
    }
    setConstellationOverlayEnabled((v) => !v);
  }, [orbitalStatus, retryOrbital]);

  const hasSelectedStar = selectedBody?.kind === 'star';

  const spaceView = (
    <ErrorBoundary fallback={<CockpitFallback variant="inline" />}>
      <SpaceView
        ref={spaceViewRef}
        reading={reading}
        showGuides={showGuides}
        showBodyLabels={bodyLabelsEnabled}
        showSatellites={satellitesEnabled}
        orbitalSatellites={constellationOverlayActive ? orbitalSatellites : []}
        constellationMode="modern"
        liveLatitude={city.lat}
        liveLongitude={city.lon}
        markerLatitude={reading?.input.latitude ?? city.lat}
        markerLongitude={reading?.input.longitude ?? city.lon}
        markerLabel={reading?.input.placeLabel ?? city.label}
        selectedBody={selectedBody}
        onBodySelect={handleBodySelect}
        sideViewActive={sideViewActive}
        onDistanceChange={setDistanceLabel}
      />
    </ErrorBoundary>
  );

  const displayValue = {
    bodyLabelsEnabled,
    toggleBodyLabels,
    guidesEnabled: showGuides,
    toggleGuides,
    satellitesEnabled,
    toggleSatellites,
    constellationOverlayEnabled,
    toggleConstellationOverlay,
    orbitalAvailable,
    orbitalStatus,
    sideViewActive,
    toggleSideView,
    hasSelectedStar,
  };

  const offscreenReport = reading ? (
    <OffscreenFullReport ref={fullReportRef} reading={reading} />
  ) : null;

  if (isMobile) {
    return (
      <CockpitDisplayProvider {...displayValue}>
        <MobileCockpit
          date={date}
          time={time}
          city={city}
          onDateChange={setDate}
          onTimeChange={setTime}
          onCityChange={setUserCity}
          onJump={handleJump}
          searchHistory={searchHistory}
          onRecordSearch={recordSearch}
          onRemoveSearch={removeSearch}
          reading={reading}
          hasSharedFromUrl={sharedFromUrl !== null}
          selectedBody={selectedBody}
          onCloseSelection={clearSelection}
          onFlySun={flyToSun}
          onFlyMoon={flyToMoon}
          onFlyEarth={flyToEarth}
          onRevealConstellation={revealConstellation}
          activeTab={mobileActiveTab}
          onActiveTabChange={setMobileActiveTab}
          analysisAttention={analysisAttention}
          onShareLink={handleShareLink}
          shareCopied={shareCopied}
          canShareLink={canShareLink}
          onExportView={handleExportView}
          exportingView={exportingView}
          onExportPdf={handleExportPdf}
          exportingPdf={exportingPdf}
          canExportReport={!!reading}
          distanceLabel={distanceLabel}
        >
          {spaceView}
        </MobileCockpit>
        {offscreenReport}
      </CockpitDisplayProvider>
    );
  }

  return (
    <CockpitDisplayProvider {...displayValue}>
    <div
      ref={cockpitRef}
      id="cockpit-main"
      tabIndex={-1}
      className="fixed inset-0 overflow-hidden bg-background"
    >
      <a href="#cockpit-main" className="skip-to-main">
        {t.cockpit.skipToMain}
      </a>

      {/* === 3D VIEW — text selection disabled (globe navigation / capture) === */}
      <div
        className="absolute top-0 bottom-0 right-0 z-0 select-none touch-manipulation
                   transition-[left] duration-300 ease-out"
        style={canvasInsetStyle}
      >
        {spaceView}
      </div>

      {/* === CRYSTAL-BALL VIGNETTE === */}
      <div className="absolute inset-0 z-1 pointer-events-none crystal-vignette" />

      {/* === KEYBOARD HINT — surfaces the 3D keyboard navigation === */}
      <KeyboardHintChip
        onOpen={openLegend}
        hidden={activePanel === 'legend'}
      />

      {/* === CAMERA DISTANCE — live altitude, refreshed by the Cesium listener === */}
      <DistanceChip label={distanceLabel} />

      {/* === HUD FRAME (slim — status only; branding lives in the sidebar) === */}
      <div
        className="absolute top-0 z-10 pointer-events-none
                   transition-[left] duration-300 ease-out"
        style={{ left: sidebarWidth, right: 0 }}
      >
        <HudFrame
          reading={reading}
          observerLat={city.lat}
          observerLon={city.lon}
          onOpenSummary={openSummary}
        />
      </div>

      {/* === SIDEBAR — unified column (form, analysis, camera, layers, system) === */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        analysisOpen={analysisOpen}
        analysisAttention={analysisAttention}
        onOpenAnalysis={handleOpenAnalysis}
        date={date}
        time={time}
        city={city}
        onDateChange={setDate}
        onTimeChange={setTime}
        onCityChange={setUserCity}
        onJump={handleJump}
        searchHistory={searchHistory}
        onRecordSearch={recordSearch}
        onRemoveSearch={removeSearch}
        hasReading={!!reading}
        onFlySun={flyToSun}
        onFlyMoon={flyToMoon}
        onFlyEarth={flyToEarth}
        fullscreenActive={fullscreenActive}
        onToggleFullscreen={toggleFullscreen}
        onShareLink={handleShareLink}
        shareCopied={shareCopied}
        canShareLink={canShareLink}
        onExportView={handleExportView}
        exportingView={exportingView}
        onExportPdf={handleExportPdf}
        exportingPdf={exportingPdf}
        canExportReport={!!reading}
      />

      {/* === ANALYSIS MODAL — tabs: resume / carte / lecture / donnees === */}
      <AnalysisModal
        open={analysisOpen}
        activeTab={analysisTab}
        onActiveTabChange={setAnalysisTab}
        onClose={closeAnalysis}
        reading={reading}
        labelsEnabled={bodyLabelsEnabled}
        onToggleLabels={toggleBodyLabels}
        onRevealConstellation={handleRevealFromModal}
        satellitesEnabled={satellitesEnabled}
      />

      {/* === FLOATING HUD CARDS — glassmorphism overlays above the sky === */}
      <AnimatePresence mode="wait">
        {activePanel === 'body' && selectedBody && (
          <BodyInfoHud
            key={bodyInfoKey(selectedBody)}
            selected={selectedBody}
            sidebarWidth={sidebarWidth}
            sideViewActive={sideViewActive}
            onToggleSideView={toggleSideView}
            onClose={clearSelection}
          />
        )}
        {activePanel === 'legend' && (
          <LegendPanel
            key="legend"
            sidebarWidth={sidebarWidth}
            onClose={closePanel}
          />
        )}
      </AnimatePresence>

    </div>
    {offscreenReport}
    </CockpitDisplayProvider>
  );
}

// Stable key per body so React re-mounts BodyInfoHud on a new pick.
function bodyInfoKey(body: SelectedBody): string {
  switch (body.kind) {
    case 'star':
      return `star-${body.constellationAbbr}-${body.starIndex}`;
    case 'sun':
      return 'sun';
    case 'moon':
      return 'moon';
    case 'planet':
      return `planet-${body.id}`;
    case 'satellite':
      return `satellite-${body.relicId}`;
  }
}

