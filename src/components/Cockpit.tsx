import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  type SectionKey,
  type SidebarPanelKey,
} from './Sidebar';
import {
  CartePanel,
  DonneesPanel,
  FullReport,
  LecturePanel,
  ResumePanel,
} from './RightPanel';
import { LegendPanel } from './LegendPanel';
import { useCockpitAudio } from '../hooks/useCockpitAudio';
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
import { CONSTELLATION_LORE } from '../utils/constellationLore';
import type { CityResult } from './CityAutocomplete';
import { timezoneFromLatLon } from '../utils/timezone';
import { useOrbitalPopulation } from '../hooks/useOrbitalPopulation';

const DEFAULT_CITY: CityResult = {
  label: 'Paris, France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: timezoneFromLatLon(48.8566, 2.3522),
};

// Second-tier dock width — clamped on narrow viewports so the canvas
// always keeps a visible strip even with sidebar + panel both open.
const dockWidthFor = (sidebarPx: number) =>
  `min(20rem, calc(100vw - ${sidebarPx}px - 1rem))`;

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

/** Section a panel belongs to — drives the auto-expand logic. */
function sectionForPanel(panel: SidebarPanelKey | null): SectionKey | null {
  if (panel === null) return null;
  if (panel === 'body') return 'selection';
  if (panel === 'legend') return null;
  return 'analysis';
}

function selectedBodyLabel(body: SelectedBody | null): string | null {
  if (!body) return null;
  switch (body.kind) {
    case 'star': {
      const lore = CONSTELLATION_LORE[body.constellationAbbr as keyof typeof CONSTELLATION_LORE];
      return lore ? `Étoile · ${lore.fr}` : 'Étoile';
    }
    case 'sun':
      return 'Soleil';
    case 'moon':
      return 'Lune';
    case 'planet':
      return body.name;
    case 'satellite':
      return body.name;
  }
}

export function Cockpit() {
  const isMobile = useMobileLayout();

  const [reading, setReading] = useState<CelestialReading | null>(null);

  // The natal form lives at the top of the sidebar (always visible), so
  // the dock starts empty. Analysis panels open from the sidebar nav once
  // the user has computed a reading.
  const [activePanel, setActivePanel] = useState<SidebarPanelKey | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(
    'analysis',
  );

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

  const reduceMotion = useReducedMotion();

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

  const audio = useCockpitAudio();

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

  /** Open or close a panel; auto-expands the relevant sidebar section. */
  const togglePanel = (key: SidebarPanelKey) => {
    cancelPendingPanelOpen();
    setActivePanel((prev) => {
      const next = prev === key ? null : key;
      const section = sectionForPanel(next);
      if (section) setExpandedSection(section);
      return next;
    });
  };

  const openPanel = (key: SidebarPanelKey) => {
    cancelPendingPanelOpen();
    setActivePanel(key);
    const section = sectionForPanel(key);
    if (section) setExpandedSection(section);
  };

  const closePanel = () => {
    cancelPendingPanelOpen();
    setActivePanel(null);
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
        openPanel('resume');
      }, REVEAL_PANEL_DELAY_MS);
    }
  };

  const handleJump = (r: CelestialReading) => {
    const isFirstCalc = reading == null;
    setReading(r);
    if (!isFirstCalc) {
      // Subsequent recomputes — keep the user's overlays/panel state intact.
      // Dramatic reveal is reserved for the live → natal transition.
      return;
    }
    // First calc: empty sky, scrub overlays, defer the RÉSUMÉ reveal so the
    // user discovers the reading rather than landing on a wall of cards.
    setShowGuides(false);
    setBodyLabelsEnabled(false);
    setSatellitesEnabled(false);
    setConstellationOverlayEnabled(false);
    cancelPendingPanelOpen();
    setActivePanel(null);
    setExpandedSection('analysis');
    if (reduceMotion) {
      openPanel('resume');
      return;
    }
    revealPanelTimerRef.current = window.setTimeout(() => {
      revealPanelTimerRef.current = null;
      openPanel('resume');
    }, REVEAL_PANEL_DELAY_MS);
  };

  const toggleAudio = () => {
    if (audio.enabled) audio.stop();
    else audio.start();
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

  // Canvas left inset: sidebar width (animated) + panel width if a panel
  // is open. Right inset is always 0 — the second-tier dock lives next
  // to the sidebar, on the left side of the viewport only.
  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;
  const dockWidth = dockWidthFor(sidebarWidth);
  // Body and legend float over the canvas as glassmorphism cards; only
  // the dense analysis panels widen the canvas inset.
  const isFloatingPanel = activePanel === 'body' || activePanel === 'legend';
  const dockedPanelOpen = activePanel !== null && !isFloatingPanel;
  const canvasInsetStyle = {
    left: dockedPanelOpen
      ? `calc(${sidebarWidth}px + ${dockWidth})`
      : `${sidebarWidth}px`,
  };

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
        onBlip={audio.blip}
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
        audioEnabled={audio.enabled}
        onToggleAudio={toggleAudio}
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
          onOpenSummary={() => openPanel('resume')}
        />
      </div>

      {/* === SIDEBAR — colonne unifiée (navigation, chronologie, analyse, système) === */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        expandedSection={expandedSection}
        onExpandSection={setExpandedSection}
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        date={date}
        time={time}
        city={city}
        onDateChange={setDate}
        onTimeChange={setTime}
        onCityChange={setUserCity}
        onJump={handleJump}
        onBlip={audio.blip}
        hasReading={!!reading}
        hasSelectedBody={!!selectedBody}
        selectedBodyLabel={selectedBodyLabel(selectedBody)}
        onFlySun={() => spaceViewRef.current?.flyToSun()}
        onFlyMoon={() => spaceViewRef.current?.flyToMoon()}
        onFlyEarth={() => spaceViewRef.current?.flyToEarth()}
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
        audioEnabled={audio.enabled}
        onToggleAudio={toggleAudio}
        fullscreenActive={fullscreenActive}
        onToggleFullscreen={toggleFullscreen}
        onExportView={handleExportView}
        exportingView={exportingView}
        onExportReport={handleExport}
        exportingReport={exporting}
        canExportReport={!!reading}
      />

      {/* === DOCKED PANEL — second-tier slide-out adjacent to the sidebar === */}
      <DockedPanel
        open={dockedPanelOpen}
        sidebarWidth={sidebarWidth}
        dockWidth={dockWidth}
        panelId={
          activePanel && !isFloatingPanel
            ? `panel-${activePanel}`
            : 'panel-second-tier'
        }
      >
        {activePanel === 'resume' && (
          <ResumePanel
            reading={reading}
            labelsEnabled={bodyLabelsEnabled}
            onToggleLabels={() => setBodyLabelsEnabled((v) => !v)}
            onRevealConstellation={() => {
              closePanel();
              revealConstellation({ openPanelAfter: false });
            }}
            onClose={closePanel}
          />
        )}
        {activePanel === 'carte' && (
          <CartePanel reading={reading} onClose={closePanel} />
        )}
        {activePanel === 'lecture' && (
          <LecturePanel
            reading={reading}
            satellitesEnabled={satellitesEnabled}
            onClose={closePanel}
          />
        )}
        {activePanel === 'donnees' && (
          <DonneesPanel reading={reading} onClose={closePanel} />
        )}
      </DockedPanel>

      {/* === FLOATING HUD CARDS — glassmorphism overlays above the sky === */}
      <AnimatePresence mode="wait">
        {activePanel === 'body' && selectedBody && (
          <BodyInfoHud
            key={bodyInfoKey(selectedBody)}
            selected={selectedBody}
            sidebarWidth={sidebarWidth}
            sideViewActive={sideViewActive}
            onToggleSideView={() => setSideViewActive((v) => !v)}
            onClose={closePanel}
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

/**
 * Docked second-tier panel that slides out from the sidebar's right edge.
 * Width and height are predictable across panel kinds so the canvas
 * inset transition stays smooth as the user navigates.
 */
function DockedPanel({
  open,
  sidebarWidth,
  dockWidth,
  panelId,
  children,
}: {
  open: boolean;
  sidebarWidth: number;
  dockWidth: string;
  panelId: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      id={panelId}
      initial={false}
      animate={{ x: open ? '0%' : '-100%', opacity: open ? 1 : 0 }}
      transition={
        reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 32 }
      }
      aria-hidden={!open}
      className="absolute top-11 z-25
                 bottom-[env(safe-area-inset-bottom,0)]
                 bg-surface-raised/95 backdrop-blur-2xl
                 border border-border-control border-l-0
                 rounded-r-sm
                 shadow-cockpit-panel"
      style={{
        width: dockWidth,
        left: `${sidebarWidth}px`,
      }}
    >
      <div className="h-full min-h-0 overflow-hidden flex flex-col">{children}</div>
    </motion.aside>
  );
}
