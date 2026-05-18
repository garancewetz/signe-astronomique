import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGeolocation } from '../hooks/useGeolocation';
import {
  SpaceView,
  LIVE_TLE_VALIDITY_MS,
  type SelectedBody,
  type SpaceViewHandle,
} from './space/SpaceView';
import { HudFrame } from './HudFrame';
import { BodyInfoHud } from './BodyInfoHud';
import {
  Sidebar,
  SIDEBAR_COLLAPSED_PX,
  SIDEBAR_EXPANDED_PX,
  type ReportPanelKey,
  type SidebarPanelKey,
} from './sidebar';
import { FullReport } from './RightPanel';
import { AnalysisModal } from './AnalysisModal';
import { LegendPanel } from './LegendPanel';
import { useMobileLayout } from '../hooks/useMobileLayout';
import { MobileCockpit } from './mobile/MobileCockpit';
import type { MobileTabKey } from './mobile/MobileTabBar';
import {
  downloadCanvasPng,
  exportTargetedPng,
  reportFilename,
  viewFilename,
} from '../utils/exportReport';
import type { CelestialReading } from '../utils/astroEngine';
import type { CityResult } from './CityAutocomplete';
import { timezoneFromLatLon } from '../utils/timezone';
import { useOrbitalPopulation } from '../hooks/useOrbitalPopulation';

const DEFAULT_CITY: CityResult = {
  label: 'Paris, France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: timezoneFromLatLon(48.8566, 2.3522),
};

// Reveal sequence timings (unchanged).
const REVEAL_LABEL_HOLD_MS = 3000;
const REVEAL_PANEL_DELAY_MS = 1500;

function formatInputDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatInputTime(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function Cockpit() {
  const isMobile = useMobileLayout();

  const [reading, setReading] = useState<CelestialReading | null>(null);

  // The natal form lives at the top of the sidebar (always visible).
  // Only floating panels (body picker, legend) live in activePanel now —
  // analysis content moved to a centered modal opened from the sidebar CTA.
  const [activePanel, setActivePanel] = useState<SidebarPanelKey | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisTab, setAnalysisTab] = useState<ReportPanelKey>('resume');
  const [analysisAttention, setAnalysisAttention] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportingView, setExportingView] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [bodyLabelsEnabled, setBodyLabelsEnabled] = useState(false);
  const [satellitesEnabled, setSatellitesEnabled] = useState(false);
  const [constellationOverlayEnabled, setConstellationOverlayEnabled] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [selectedBody, setSelectedBody] = useState<SelectedBody | null>(null);
  const [sideViewActive, setSideViewActive] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTabKey | null>(null);

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

  const [date, setDate] = useState(() => formatInputDate(new Date()));
  const [time, setTime] = useState(() => formatInputTime(new Date()));
  const [userCity, setUserCity] = useState<CityResult | null>(null);

  const geolocation = useGeolocation();

  const geoCity = useMemo<CityResult | null>(() => {
    if (geolocation.status !== 'resolved') return null;
    return {
      label: 'Position actuelle',
      lat: geolocation.lat,
      lon: geolocation.lon,
      timezone: timezoneFromLatLon(geolocation.lat, geolocation.lon),
    };
  }, [geolocation]);

  const city = userCity ?? geoCity ?? DEFAULT_CITY;

  const cockpitRef = useRef<HTMLDivElement>(null);
  const spaceViewRef = useRef<SpaceViewHandle>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);

  const revealLabelTimerRef = useRef<number | null>(null);
  const revealPanelTimerRef = useRef<number | null>(null);
  const labelsRestoreRef = useRef<boolean | null>(null);

  useEffect(() => {
    const onFs = () => setFullscreenActive(!!document.fullscreenElement);
    onFs();
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => () => {
    if (revealLabelTimerRef.current !== null) window.clearTimeout(revealLabelTimerRef.current);
    if (revealPanelTimerRef.current !== null) window.clearTimeout(revealPanelTimerRef.current);
  }, []);

  const cancelPendingPanelOpen = () => {
    if (revealPanelTimerRef.current !== null) {
      window.clearTimeout(revealPanelTimerRef.current);
      revealPanelTimerRef.current = null;
    }
  };

  const togglePanel = (key: SidebarPanelKey) => {
    cancelPendingPanelOpen();
    setActivePanel((prev) => (prev === key ? null : key));
  };

  const openPanel = (key: SidebarPanelKey) => {
    cancelPendingPanelOpen();
    setActivePanel(key);
  };

  const closePanel = () => {
    cancelPendingPanelOpen();
    setActivePanel(null);
  };

  /** Open the analysis modal on a given tab (defaults to 'resume'). */
  const openAnalysis = (tab: ReportPanelKey = 'resume') => {
    cancelPendingPanelOpen();
    setAnalysisTab(tab);
    setAnalysisOpen(true);
  };

  const closeAnalysis = () => {
    cancelPendingPanelOpen();
    setAnalysisOpen(false);
  };

  /** Body picker callback — wires to the SÉLECTION section. */
  const handleBodySelect = (body: SelectedBody | null) => {
    cancelPendingPanelOpen();
    setSelectedBody(body);
    setSideViewActive(false);
    if (body) {
      openPanel('body');
      setMobileActiveTab('selection');
    } else {
      setActivePanel((prev) => (prev === 'body' ? null : prev));
      setMobileActiveTab((prev) => (prev === 'selection' ? null : prev));
    }
  };

  /**
   * Reveal sequence: aim the camera at the Sun (the user's true sign)
   * and force body labels on so the constellation name is painted on
   * the sphere. After the window, the labels value the user had before
   * is restored.
   */
  const revealConstellation = (opts: { openPanelAfter: boolean }) => {
    if (revealLabelTimerRef.current !== null) {
      window.clearTimeout(revealLabelTimerRef.current);
      revealLabelTimerRef.current = null;
    }
    if (revealPanelTimerRef.current !== null) {
      window.clearTimeout(revealPanelTimerRef.current);
      revealPanelTimerRef.current = null;
    }
    labelsRestoreRef.current = bodyLabelsEnabled;
    setBodyLabelsEnabled(true);
    spaceViewRef.current?.flyToSun();
    revealLabelTimerRef.current = window.setTimeout(() => {
      revealLabelTimerRef.current = null;
      if (labelsRestoreRef.current !== null) {
        setBodyLabelsEnabled(labelsRestoreRef.current);
        labelsRestoreRef.current = null;
      }
    }, REVEAL_LABEL_HOLD_MS);
    if (opts.openPanelAfter) {
      revealPanelTimerRef.current = window.setTimeout(() => {
        revealPanelTimerRef.current = null;
        openAnalysis('resume');
      }, REVEAL_PANEL_DELAY_MS);
    }
  };

  const handleJump = (r: CelestialReading) => {
    const isFirstCalc = reading == null;
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
    cancelPendingPanelOpen();
    setActivePanel(null);
  };

  const handleExport = async () => {
    if (!reading) return;
    const spaceCanvas = spaceViewRef.current?.captureCanvas();
    const reportEl = fullReportRef.current;
    if (!spaceCanvas || !reportEl) return;
    setExporting(true);
    try {
      await exportTargetedPng(
        spaceCanvas,
        reportEl,
        reportFilename(reading.input.date, reading.input.placeLabel),
      );
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportView = async () => {
    const canvas = spaceViewRef.current?.captureCanvas();
    if (!canvas) return;
    setExportingView(true);
    try {
      await downloadCanvasPng(
        canvas,
        viewFilename(
          reading?.input.date ?? null,
          reading?.input.placeLabel,
        ),
      );
    } catch (err) {
      console.error('Export vue error', err);
    } finally {
      setExportingView(false);
    }
  };

  const toggleFullscreen = () => {
    const el = cockpitRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  };

  // Canvas left inset: sidebar width only — body/legend float over the
  // canvas as glassmorphism cards, and the analysis modal is centered.
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;
  const canvasInsetStyle = { left: `${sidebarWidth}px` };

  const orbitalToggleHandler = () => {
    if (orbitalStatus === 'error') {
      retryOrbital();
      if (!constellationOverlayEnabled) setConstellationOverlayEnabled(true);
      return;
    }
    setConstellationOverlayEnabled((v) => !v);
  };

  const spaceView = (
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
    />
  );

  if (isMobile) {
    return (
      <MobileCockpit
        date={date}
        time={time}
        city={city}
        onDateChange={setDate}
        onTimeChange={setTime}
        onCityChange={setUserCity}
        onJump={handleJump}
        reading={reading}
        selectedBody={selectedBody}
        onCloseSelection={() => handleBodySelect(null)}
        hasSelectedStar={selectedBody?.kind === 'star'}
        bodyLabelsEnabled={bodyLabelsEnabled}
        onToggleBodyLabels={() => setBodyLabelsEnabled((v) => !v)}
        guidesEnabled={showGuides}
        onToggleGuides={() => setShowGuides((v) => !v)}
        satellitesEnabled={satellitesEnabled}
        onToggleSatellites={() => setSatellitesEnabled((v) => !v)}
        constellationOverlayEnabled={constellationOverlayEnabled}
        onToggleConstellationOverlay={orbitalToggleHandler}
        orbitalAvailable={orbitalAvailable}
        orbitalStatus={orbitalStatus}
        sideViewActive={sideViewActive}
        onToggleSideView={() => setSideViewActive((v) => !v)}
        onFlySun={() => spaceViewRef.current?.flyToSun()}
        onFlyMoon={() => spaceViewRef.current?.flyToMoon()}
        onFlyEarth={() => spaceViewRef.current?.flyToEarth()}
        onRevealConstellation={() => revealConstellation({ openPanelAfter: false })}
        activeTab={mobileActiveTab}
        onActiveTabChange={setMobileActiveTab}
        analysisAttention={analysisAttention}
        fullscreenActive={fullscreenActive}
        onToggleFullscreen={toggleFullscreen}
        onExportView={handleExportView}
        exportingView={exportingView}
        onExportReport={handleExport}
        exportingReport={exporting}
        canExportReport={!!reading}
      >
        {spaceView}
      </MobileCockpit>
    );
  }

  return (
    <div
      ref={cockpitRef}
      id="cockpit-main"
      tabIndex={-1}
      className="fixed inset-0 overflow-hidden bg-background"
    >
      <a href="#cockpit-main" className="skip-to-main">
        Aller au contenu principal
      </a>

      {/* === VUE 3D — sélection de texte désactivée (navigation globe / capture) === */}
      <div
        className="absolute top-0 bottom-0 right-0 z-0 select-none touch-manipulation
                   transition-[left] duration-300 ease-out"
        style={canvasInsetStyle}
      >
        {spaceView}
      </div>

      {/* === VIGNETTE BOULE DE CRISTAL === */}
      <div className="absolute inset-0 z-1 pointer-events-none crystal-vignette" />

      {/* === CADRE HUD (slim — état seul, branding déplacé en sidebar) === */}
      <div
        className="absolute top-0 z-10 pointer-events-none
                   transition-[left] duration-300 ease-out"
        style={{ left: sidebarWidth, right: 0 }}
      >
        <HudFrame
          reading={reading}
          observerLat={city.lat}
          observerLon={city.lon}
          onOpenSummary={() => openAnalysis('resume')}
          onFlySun={() => spaceViewRef.current?.flyToSun()}
          onFlyMoon={() => spaceViewRef.current?.flyToMoon()}
          onFlyEarth={() => spaceViewRef.current?.flyToEarth()}
        />
      </div>

      {/* === SIDEBAR — colonne unifiée (formulaire, analyse, calques, système) === */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        analysisOpen={analysisOpen}
        analysisAttention={analysisAttention}
        onOpenAnalysis={() => openAnalysis()}
        date={date}
        time={time}
        city={city}
        onDateChange={setDate}
        onTimeChange={setTime}
        onCityChange={setUserCity}
        onJump={handleJump}
        hasReading={!!reading}
        guidesEnabled={showGuides}
        onToggleGuides={() => setShowGuides((v) => !v)}
        bodyLabelsEnabled={bodyLabelsEnabled}
        onToggleBodyLabels={() => setBodyLabelsEnabled((v) => !v)}
        satellitesEnabled={satellitesEnabled}
        onToggleSatellites={() => setSatellitesEnabled((v) => !v)}
        constellationOverlayEnabled={constellationOverlayEnabled}
        onToggleConstellationOverlay={orbitalToggleHandler}
        orbitalAvailable={orbitalAvailable}
        orbitalStatus={orbitalStatus}
        hasSelectedStar={selectedBody?.kind === 'star'}
        sideViewActive={sideViewActive}
        onToggleSideView={() => setSideViewActive((v) => !v)}
        fullscreenActive={fullscreenActive}
        onToggleFullscreen={toggleFullscreen}
        onExportView={handleExportView}
        exportingView={exportingView}
        onExportReport={handleExport}
        exportingReport={exporting}
        canExportReport={!!reading}
      />

      {/* === MODALE ANALYSE — onglets MON SIGNE / CARTE / LECTURE / DONNÉES === */}
      <AnalysisModal
        open={analysisOpen}
        activeTab={analysisTab}
        onActiveTabChange={setAnalysisTab}
        onClose={closeAnalysis}
        reading={reading}
        labelsEnabled={bodyLabelsEnabled}
        onToggleLabels={() => setBodyLabelsEnabled((v) => !v)}
        onRevealConstellation={() => {
          closeAnalysis();
          revealConstellation({ openPanelAfter: false });
        }}
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
            onToggleSideView={() => setSideViewActive((v) => !v)}
            onClose={() => handleBodySelect(null)}
          />
        )}
        {activePanel === 'legend' && (
          <LegendPanel
            key="legend"
            sidebarWidth={sidebarWidth}
            onClose={closePanel}
            bodyLabelsEnabled={bodyLabelsEnabled}
            onToggleBodyLabels={() => setBodyLabelsEnabled((v) => !v)}
            guidesEnabled={showGuides}
            onToggleGuides={() => setShowGuides((v) => !v)}
            satellitesEnabled={satellitesEnabled}
            onToggleSatellites={() => setSatellitesEnabled((v) => !v)}
            constellationOverlayEnabled={constellationOverlayEnabled}
            onToggleConstellationOverlay={orbitalToggleHandler}
            orbitalAvailable={orbitalAvailable}
          />
        )}
      </AnimatePresence>

      {/* === RAPPORT COMPLET (hors-écran) — source de l'export PNG === */}
      {reading && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-[-12000px] w-md
                     bg-surface-raised text-slate-200"
          ref={fullReportRef}
        >
          <FullReport reading={reading} />
        </div>
      )}
    </div>
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

