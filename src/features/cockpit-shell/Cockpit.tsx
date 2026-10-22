import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary';
import { CockpitFallback } from './CockpitFallback';
import { KeyboardHintChip } from './KeyboardHintChip';
import { MapKey } from './MapKey';
import { DistanceChip } from '@/ui';
import { useT } from '@/context/useLocale';
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
  SIGN_PANEL_PX,
  SignRevealPanel,
  useExportHandlers,
} from '@/features/natal-report';
import { LegendPanel } from './LegendPanel';
import { useMobileLayout } from '@/ui/useMobileLayout';
import { MobileCockpit } from './mobile/MobileCockpit';
import { MOBILE_TAB_BAR_OFFSET, type MobileTabKey } from './mobile/MobileTabBar';
import {
  loreName,
  loreShortName,
  natalPlacements,
  type CelestialReading,
} from '@/features/astronomy';
import {
  DEFAULT_BIRTH_TIME,
  formatNatalShareText,
  requestBirthTime,
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
  // Only floating panels (body picker, legend) live in activePanel — the
  // result is its own panel, docked right on desktop, a page on mobile.
  const [activePanel, setActivePanel] = useState<SidebarPanelKey | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisAttention, setAnalysisAttention] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showGuides, setShowGuides] = useState(false);
  // On by default: the zones are what proves the result in the sky.
  const [showZones, setShowZones] = useState(true);
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
  const handleRevealFromPanel = useCallback(() => {
    closeAnalysis();
    revealConstellation();
  }, [closeAnalysis, revealConstellation]);
  // The ascendant needs the birth time: open the form on that field. On
  // mobile the form is a modal, so the result page steps aside first.
  const handleAddBirthTime = useCallback(() => {
    if (isMobile) closeAnalysis();
    requestBirthTime();
  }, [isMobile, closeAnalysis]);
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

  // Canvas insets: the sidebar on the left and, while it is open, the result
  // panel on the right — the sky shrinks beside it instead of hiding under
  // it. Body/legend cards still float over the canvas.
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;
  const resultWidth = analysisOpen && reading ? SIGN_PANEL_PX : 0;
  const canvasInsetStyle = { left: `${sidebarWidth}px`, right: `${resultWidth}px` };
  // The desktop welcome card (index.html) docks beside the sidebar.
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', `${sidebarWidth}px`);
  }, [sidebarWidth]);

  const toggleBodyLabels = useCallback(
    () => setBodyLabelsEnabled((v) => !v),
    [],
  );
  const toggleGuides = useCallback(() => setShowGuides((v) => !v), []);
  const toggleZones = useCallback(() => setShowZones((v) => !v), []);
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
        showZodiacBand={showZones}
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
    zonesEnabled: showZones,
    toggleZones,
    satellitesEnabled,
    toggleSatellites,
    sideViewActive,
    toggleSideView,
    hasSelectedStar,
  };

  const signLabel = reading ? loreName(reading.trueConstellation) : null;
  const birthTimeKnown = time !== '';
  // The horoscope sign of the picked body, so its card ties back to the chart.
  const selectedHoroscope = useMemo(() => {
    if (!reading || !selectedBody) return undefined;
    const id = selectedBody.kind === 'planet' ? selectedBody.id
      : selectedBody.kind === 'sun' || selectedBody.kind === 'moon' ? selectedBody.kind
      : null;
    return id ? natalPlacements(reading).find((p) => p.id === id)?.horoscope : undefined;
  }, [reading, selectedBody]);
  // Moon and Ascendant — asked about right after the sign (the Sun, which
  // the sidebar card already shows large).
  const keyPlacements = useMemo(() => {
    if (!reading) return [];
    return natalPlacements(reading).slice(1, 3).map((p) => ({
      glyph: p.glyph,
      label: p.id === 'moon' ? t.bodies.moon : t.signReveal.ascendant,
      // The ascendant needs the time and the place.
      value: p.id === 'ascendant' && !(birthTimeKnown && reading.input.placeLabel)
        ? null
        : loreShortName(p.sky),
    }));
  }, [reading, birthTimeKnown, t]);

  const offscreenReport = reading ? (
    <OffscreenFullReport ref={fullReportRef} reading={reading} birthTimeKnown={birthTimeKnown} />
  ) : null;

  const signRevealPanel = (
    <SignRevealPanel
      open={analysisOpen}
      onClose={closeAnalysis}
      reading={reading}
      onRevealConstellation={handleRevealFromPanel}
      onAddBirthTime={handleAddBirthTime}
      onShare={handleShareLink}
      shareCopied={shareCopied}
      birthTimeKnown={birthTimeKnown}
      bottomOffset={isMobile ? MOBILE_TAB_BAR_OFFSET : undefined}
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
          welcomeOpen={welcomeSlot !== null}
          selectedBody={selectedBody}
          selectedHoroscope={selectedHoroscope}
          onCloseSelection={clearSelection}
          onFlySun={flyToSun}
          onFlyMoon={flyToMoon}
          onFlyEarth={flyToEarth}
          signOpen={analysisOpen}
          onOpenSign={openAnalysis}
          onCloseSign={closeAnalysis}
          signLabel={reading ? loreShortName(reading.trueConstellation) : null}
          activeTab={mobileActiveTab}
          onActiveTabChange={setMobileActiveTab}
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
        {signRevealPanel}
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
        className="absolute top-0 bottom-0 z-0 select-none touch-manipulation
                   transition-[left,right] duration-300 ease-out"
        style={canvasInsetStyle}
      >
        {spaceView}
      </div>

      {/* === CRYSTAL-BALL VIGNETTE === */}
      <div className="absolute inset-0 z-1 pointer-events-none crystal-vignette" />

      {/* === CANVAS CORNER CHIPS — follow the canvas when the result opens === */}
      <div
        className="absolute top-0 bottom-0 z-20 pointer-events-none [&>*]:pointer-events-auto
                   transition-[left,right] duration-300 ease-out"
        style={canvasInsetStyle}
      >
        {/* Keyboard hint — surfaces the 3D keyboard navigation */}
        {!resultWidth && <KeyboardHintChip />}
        {/* Map key — what the gold, grey and blue marks mean */}
        {reading && showZones && !sideViewActive && <MapKey placement="bottom-left" />}
        {/* Camera distance — live altitude, refreshed by the Cesium listener */}
        {/* Hidden beside the result: the narrower sky keeps its corners for the key. */}
        {!resultWidth && (
          <DistanceChip label={distanceLabel && t.distanceFromEarth(distanceLabel)} placement="bottom-right" />
        )}
      </div>

      {/* === HUD FRAME (slim — status only; branding lives in the sidebar) === */}
      <div
        className="absolute top-0 z-10 pointer-events-none
                   transition-[left,right] duration-300 ease-out"
        style={canvasInsetStyle}
      >
        <HudFrame
          reading={reading}
          birthTimeKnown={time !== ''}
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
        keyPlacements={keyPlacements}
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
            horoscopeSign={selectedHoroscope}
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
    {signRevealPanel}
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

