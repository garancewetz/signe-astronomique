import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useGeolocation } from '../hooks/useGeolocation';
import { SpaceView, type SelectedBody, type SpaceViewHandle } from './space/SpaceView';
import { HudFrame } from './HudFrame';
import { BodyInfoHud } from './BodyInfoHud';
import { LeftPanel } from './LeftPanel';
import { LeftRail } from './LeftRail';
import { RightRail, type RightRailKey } from './RightRail';
import {
  CartePanel,
  DonneesPanel,
  FullReport,
  LecturePanel,
  ResumePanel,
} from './RightPanel';
import { ControlConsole } from './ControlConsole';
import { useCockpitAudio } from '../hooks/useCockpitAudio';
import {
  downloadCanvasPng,
  exportTargetedPng,
  reportFilename,
  viewFilename,
} from '../utils/exportReport';
import { computeReading, type CelestialReading } from '../utils/astroEngine';
import type { CityResult } from './CityAutocomplete';
import { timezoneFromLatLon } from '../utils/timezone';
import { useOrbitalPopulation } from '../hooks/useOrbitalPopulation';

const DEFAULT_CITY: CityResult = {
  label: 'Paris, France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: timezoneFromLatLon(48.8566, 2.3522),
};

// Layout constants. The rail is fixed at 50 px; the docked panel slides
// out adjacent to it. Canvas insets are computed from these so Cesium
// recenters in the visible band when a panel opens — no camera math.
const RAIL_PX = 50;
const DOCK_WIDTH = 'min(20rem, calc(100vw - 50px - 1rem))';

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
  const [reading, setReading] = useState<CelestialReading | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [activeRight, setActiveRight] = useState<RightRailKey | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingView, setExportingView] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [bodyLabelsEnabled, setBodyLabelsEnabled] = useState(false);
  const [satellitesEnabled, setSatellitesEnabled] = useState(false);
  const [constellationOverlayEnabled, setConstellationOverlayEnabled] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [selectedBody, setSelectedBody] = useState<SelectedBody | null>(null);
  const [depthViewActive, setDepthViewActive] = useState(false);
  const [sideViewActive, setSideViewActive] = useState(false);

  // Body selection drives the right rail: a non-null body auto-opens the
  // body slot; clearing the selection collapses it (and closes the dock
  // if it was showing the body panel).
  const handleBodySelect = (body: SelectedBody | null) => {
    setSelectedBody(body);
    setDepthViewActive(false);
    setSideViewActive(false);
    if (body) setActiveRight('body');
    else setActiveRight((prev) => (prev === 'body' ? null : prev));
  };

  const {
    satellites: orbitalSatellites,
    status: orbitalStatus,
    retry: retryOrbital,
  } = useOrbitalPopulation(constellationOverlayEnabled);

  const [date, setDate] = useState('1990-06-15');
  const [time, setTime] = useState('14:30');
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

  useEffect(() => {
    const onFs = () => setFullscreenActive(!!document.fullscreenElement);
    onFs();
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const handleJump = (r: CelestialReading) => {
    setReading(r);
    setLeftOpen(false);
    setActiveRight('resume');
  };

  const handleJumpNow = () => {
    const now = new Date();
    setDate(formatInputDate(now));
    setTime(formatInputTime(now));
    handleJump(
      computeReading({
        date: now,
        latitude: city.lat,
        longitude: city.lon,
        placeLabel: city.label,
      }),
    );
  };

  const toggleAudio = () => {
    if (audio.enabled) audio.stop();
    else audio.start();
  };

  const toggleRightPanel = (key: RightRailKey) => {
    setActiveRight((prev) => (prev === key ? null : key));
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

  // Canvas left/right inset: rail-only (50 px) when no panel is open,
  // rail + dock when a side panel slides out. CSS transitions keep the
  // canvas in step with the panel; Cesium's render loop picks up the
  // resize automatically each frame.
  const canvasInsetStyle = {
    left: leftOpen ? `calc(${RAIL_PX}px + ${DOCK_WIDTH})` : `${RAIL_PX}px`,
    right: activeRight ? `calc(${RAIL_PX}px + ${DOCK_WIDTH})` : `${RAIL_PX}px`,
  };

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
        className="absolute top-0 bottom-0 z-0 select-none touch-manipulation
                   transition-[left,right] duration-300 ease-out"
        style={canvasInsetStyle}
      >
        <SpaceView
          ref={spaceViewRef}
          reading={reading}
          showGuides={showGuides}
          showBodyLabels={bodyLabelsEnabled}
          showSatellites={satellitesEnabled}
          orbitalSatellites={constellationOverlayEnabled ? orbitalSatellites : []}
          constellationMode="modern"
          liveLatitude={city.lat}
          liveLongitude={city.lon}
          markerLatitude={reading?.input.latitude ?? city.lat}
          markerLongitude={reading?.input.longitude ?? city.lon}
          markerLabel={reading?.input.placeLabel ?? city.label}
          selectedBody={selectedBody}
          onBodySelect={handleBodySelect}
          depthViewActive={depthViewActive}
          sideViewActive={sideViewActive}
        />
      </div>

      {/* === VIGNETTE BOULE DE CRISTAL === */}
      <div className="absolute inset-0 z-1 pointer-events-none crystal-vignette" />

      {/* === CADRE HUD === */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <HudFrame
          reading={reading}
          onOpenSummary={() => setActiveRight('resume')}
        />
      </div>

      {/* === RAILS — colonnes fixes 50 px === */}
      <LeftRail
        coordonneesOpen={leftOpen}
        onToggleCoordonnees={() => setLeftOpen((v) => !v)}
        onJumpNow={handleJumpNow}
      />
      <RightRail
        activeKey={activeRight}
        onToggle={toggleRightPanel}
        hasSelectedBody={!!selectedBody}
      />

      {/* === DOCKED PANELS — slide out adjacent to the rails === */}
      <DockedPanel side="left" open={leftOpen} panelId="panel-coordonnees">
        <LeftPanel
          date={date}
          time={time}
          city={city}
          onDateChange={setDate}
          onTimeChange={setTime}
          onCityChange={setUserCity}
          onJump={handleJump}
          onBlip={audio.blip}
          onClose={() => setLeftOpen(false)}
        />
      </DockedPanel>

      <DockedPanel
        side="right"
        open={activeRight !== null}
        panelId={activeRight ? `panel-${activeRight}` : 'panel-right'}
      >
        {activeRight === 'resume' && (
          <ResumePanel reading={reading} onClose={() => setActiveRight(null)} />
        )}
        {activeRight === 'carte' && (
          <CartePanel reading={reading} onClose={() => setActiveRight(null)} />
        )}
        {activeRight === 'lecture' && (
          <LecturePanel
            reading={reading}
            satellitesEnabled={satellitesEnabled}
            onClose={() => setActiveRight(null)}
          />
        )}
        {activeRight === 'donnees' && (
          <DonneesPanel reading={reading} onClose={() => setActiveRight(null)} />
        )}
        {activeRight === 'body' && selectedBody && (
          <BodyInfoHud
            key={bodyInfoKey(selectedBody)}
            selected={selectedBody}
            depthViewActive={depthViewActive}
            onToggleDepthView={() => setDepthViewActive((v) => !v)}
            sideViewActive={sideViewActive}
            onToggleSideView={() => setSideViewActive((v) => !v)}
            onClose={() => handleBodySelect(null)}
          />
        )}
      </DockedPanel>

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

      {/* === CONSOLE (BAS) — caméra + affichage + audio === */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20
                   pb-[max(0,env(safe-area-inset-bottom))]
                   bg-linear-to-t from-background/98 via-background/85 to-transparent
                   backdrop-blur-md border-t border-border-hud-faint"
      >
        <div className="absolute top-0 inset-x-0 h-px
                        bg-linear-to-r from-transparent via-border-hud to-transparent" />
        <ControlConsole
          audioEnabled={audio.enabled}
          onToggleAudio={toggleAudio}
          guidesEnabled={showGuides}
          onToggleGuides={() => setShowGuides(v => !v)}
          bodyLabelsEnabled={bodyLabelsEnabled}
          onToggleBodyLabels={() => setBodyLabelsEnabled(v => !v)}
          satellitesEnabled={satellitesEnabled}
          onToggleSatellites={() => setSatellitesEnabled(v => !v)}
          constellationOverlayEnabled={constellationOverlayEnabled}
          onToggleConstellationOverlay={() => {
            if (orbitalStatus === 'error') {
              retryOrbital();
              if (!constellationOverlayEnabled) setConstellationOverlayEnabled(true);
              return;
            }
            setConstellationOverlayEnabled(v => !v);
          }}
          orbitalStatus={orbitalStatus}
          onFlySun={() => spaceViewRef.current?.flyToSun()}
          onFlyMoon={() => spaceViewRef.current?.flyToMoon()}
          onFlyEarth={() => spaceViewRef.current?.flyToEarth()}
          onExportView={handleExportView}
          exportingView={exportingView}
          onExportReport={handleExport}
          exportingReport={exporting}
          canExportReport={!!reading}
          onToggleFullscreen={toggleFullscreen}
          fullscreenActive={fullscreenActive}
        />
      </div>
    </div>
  );
}

// Stable key per selection so React tears down and re-mounts the HUD when
// the user picks a different body — avoids stale local state inside the panel.
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
  }
}

/**
 * Docked side panel that slides out from inside the rail. Owns the
 * surrounding chrome (background, border, blur) so panel content
 * components stay focused on their own structure. Width is clamped on
 * narrow viewports so the canvas always keeps a visible strip.
 */
function DockedPanel({
  side,
  open,
  panelId,
  children,
}: {
  side: 'left' | 'right';
  open: boolean;
  panelId: string;
  children: React.ReactNode;
}) {
  const isLeft = side === 'left';
  const reduceMotion = useReducedMotion();
  const closedX = isLeft ? '-100%' : '100%';

  return (
    <motion.aside
      id={panelId}
      initial={false}
      animate={{ x: open ? '0%' : closedX }}
      transition={
        reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 32 }
      }
      aria-hidden={!open}
      className={`absolute top-11 z-25
                  bottom-[calc(6rem+env(safe-area-inset-bottom,0))]
                  bg-surface-raised/95 backdrop-blur-2xl
                  border border-border-control
                  ${isLeft ? 'rounded-r-sm border-l-0' : 'rounded-l-sm border-r-0'}
                  shadow-cockpit-panel`}
      style={{
        width: DOCK_WIDTH,
        [isLeft ? 'left' : 'right']: `${RAIL_PX}px`,
      }}
    >
      <div className="h-full min-h-0 overflow-hidden flex flex-col">{children}</div>
    </motion.aside>
  );
}
