import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary';
import { CockpitFallback } from './CockpitFallback';
import { KeyboardHintChip } from './KeyboardHintChip';
import { DistanceChip } from '@/ui';
import { useLocale, useT } from '@/context/useLocale';
import {
  SpaceView,
  useRevealSequence,
  type SelectedBody,
  type SpaceViewHandle,
} from '@/features/space-viewport';
import { WelcomeForm } from './WelcomeForm';
import { WELCOME_EVENTS } from './welcomeEvents';
import { useWelcomeSlot } from './useWelcomeSlot';
import { HudFrame } from './HudFrame';
import { BodyInfoHud } from './BodyInfoHud';
import {
  Sidebar,
  SIDEBAR_COLLAPSED_PX,
  SIDEBAR_EXPANDED_PX,
  type SidebarPanelKey,
} from './sidebar';
import {
  OffscreenFullReport,
  SignRevealModal,
  useExportHandlers,
} from '@/features/natal-report';
import { LegendPanel } from './LegendPanel';
import { useMobileLayout } from '@/ui/useMobileLayout';
import { MobileCockpit } from './mobile/MobileCockpit';
import type { MobileTabKey } from './mobile/MobileTabBar';
import { loreName, loreShortName, type CelestialReading } from '@/features/astronomy';
import {
  DEFAULT_BIRTH_TIME,
  formatNatalShareText,
  useNatalForm,
  useSearchHistory,
  useShareLink,
} from '@/features/natal-input';
import { CockpitDisplayProvider } from '@/context/CockpitDisplayContext';

export function Cockpit() {
  const isMobile = useMobileLayout();
  const t = useT();
  const { locale } = useLocale();

  const [reading, setReading] = useState<CelestialReading | null>(null);

  // The natal form lives at the top of the sidebar (always visible).
  // Only floating panels (body picker, legend) live in activePanel — the
  // true-sign reveal is a centered modal shared by desktop and mobile.
  const [activePanel, setActivePanel] = useState<SidebarPanelKey | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisAttention, setAnalysisAttention] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showGuides, setShowGuides] = useState(false);
  const [bodyLabelsEnabled, setBodyLabelsEnabled] = useState(false);
  const [satellitesEnabled, setSatellitesEnabled] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [selectedBody, setSelectedBody] = useState<SelectedBody | null>(null);
  const [sideViewActive, setSideViewActive] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTabKey | null>(null);
  const [distanceLabel, setDistanceLabel] = useState<string | null>(null);

  const {
    date,
    time,
    city,
    setDate,
    setTime,
    setUserCity,
    sharedFromUrl,
  } = useNatalForm();
  // Mobile only: the welcome card hosts the birth form (there is no sidebar
  // to point at). Desktop keeps the form in the sidebar so it never moves.
  const welcomeSlot = useWelcomeSlot(isMobile);
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

  const openAnalysis = useCallback(() => setAnalysisOpen(true), []);

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
    // The answer is what people came for: show it right away. The CTA
    // pulse stays so they can find it again after closing.
    setAnalysisAttention((k) => k + 1);
    setAnalysisOpen(true);
    // Whichever form computed it (sidebar, mobile sheet, welcome card), the
    // welcome card has done its job and must not sit over the result.
    window.dispatchEvent(new Event(WELCOME_EVENTS.dismiss));
    if (!isFirstCalc) return;
    // First calc: keep the sky uncluttered but reward curiosity by lighting
    // up the constellation patterns (coupled with body labels in the scene
    // composition). Other heavy overlays stay off until the user opts in.
    setShowGuides(false);
    setBodyLabelsEnabled(true);
    setSatellitesEnabled(false);
    setActivePanel(null);
  }, []);

  // Pre-formatted body for the native share sheet. Computed here (rather
  // than inside useShareLink) so the hook stays i18n-free.
  // An unknown birth time is computed at noon — share that same instant.
  const shareTime = time || DEFAULT_BIRTH_TIME;
  const shareText = useMemo(
    () => formatNatalShareText(date, shareTime, city.label, t.intlLocale),
    [city.label, date, shareTime, t.intlLocale],
  );

  const { handleShareLink, shareCopied, canShareLink } = useShareLink({
    date,
    time: shareTime,
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

  const hasSelectedStar = selectedBody?.kind === 'star';

  const spaceView = (
    <ErrorBoundary fallback={<CockpitFallback variant="inline" />}>
      <SpaceView
        ref={spaceViewRef}
        reading={reading}
        showGuides={showGuides}
        showBodyLabels={bodyLabelsEnabled}
        showSatellites={satellitesEnabled}
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
    sideViewActive,
    toggleSideView,
    hasSelectedStar,
  };

  const signLabel = reading ? loreName(reading.trueConstellation, locale) : null;

  const offscreenReport = reading ? (
    <OffscreenFullReport ref={fullReportRef} reading={reading} />
  ) : null;

  const signRevealModal = (
    <SignRevealModal
      open={analysisOpen}
      onClose={closeAnalysis}
      reading={reading}
      onRevealConstellation={handleRevealFromModal}
      onShare={handleShareLink}
      shareCopied={shareCopied}
      birthTimeKnown={time !== ''}
    />
  );

  const welcomeForm = (
    <WelcomeForm
      target={welcomeSlot}
      date={date}
      time={time}
      city={city}
      onDateChange={setDate}
      onTimeChange={setTime}
      onCityChange={setUserCity}
      onJump={handleJump}
      onRecordHistory={recordSearch}
    />
  );

  if (isMobile) {
    return (
      <CockpitDisplayProvider {...displayValue}>
        {welcomeForm}
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
          onOpenSign={openAnalysis}
          signLabel={reading ? loreShortName(reading.trueConstellation, locale) : null}
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
        {signRevealModal}
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
          onOpenSummary={openAnalysis}
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
        onOpenAnalysis={openAnalysis}
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
        signLabel={signLabel}
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
    {signRevealModal}
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

