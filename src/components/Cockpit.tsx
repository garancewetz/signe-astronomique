import { useEffect, useMemo, useRef, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { motion, useReducedMotion } from 'framer-motion';
import { SpaceView, type SpaceViewHandle } from './space/SpaceView';
import { HudFrame } from './HudFrame';
import { LeftPanel } from './LeftPanel';
import {
  CartePanel,
  DonneesPanel,
  FullReport,
  LecturePanel,
  ResumePanel,
  type ReportPanelKey,
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
import { Button, cn } from './ui';
import { useOrbitalPopulation } from '../hooks/useOrbitalPopulation';

const DEFAULT_CITY: CityResult = {
  label: 'Paris, France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: timezoneFromLatLon(48.8566, 2.3522),
};

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

// Onglets droits empilés verticalement le long du bord. Les `tabTop`
// donnent le centre vertical de chaque onglet (avec -translate-y-1/2),
// répartis pour ne pas se chevaucher.
const RIGHT_PANELS: {
  key: ReportPanelKey;
  label: string;
  tabTop: string;
}[] = [
  { key: 'resume',   label: '◇ RÉSUMÉ',   tabTop: 'top-[18%]' },
  { key: 'carte',    label: '✦ CARTE',    tabTop: 'top-[36%]' },
  { key: 'lecture',  label: '✧ LECTURE',  tabTop: 'top-[54%]' },
  { key: 'donnees',  label: '◈ DONNÉES',  tabTop: 'top-[72%]' },
];

export function Cockpit() {
  const [reading, setReading] = useState<CelestialReading | null>(null);
  // Panel gauche ouvert par défaut : c'est le formulaire — l'utilisateur doit
  // pouvoir saisir ses coordonnées immédiatement.
  const [leftOpen, setLeftOpen] = useState(true);
  const [activeRight, setActiveRight] = useState<ReportPanelKey | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingView, setExportingView] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [bodyLabelsEnabled, setBodyLabelsEnabled] = useState(false);
  const [satellitesEnabled, setSatellitesEnabled] = useState(false);
  const [constellationOverlayEnabled, setConstellationOverlayEnabled] = useState(false);
  const [constellationMode, setConstellationMode] = useState<'modern' | 'historical'>('modern');
  const [fullscreenActive, setFullscreenActive] = useState(false);

  const {
    satellites: orbitalSatellites,
    status: orbitalStatus,
    retry: retryOrbital,
  } = useOrbitalPopulation(constellationOverlayEnabled);

  // État du formulaire — vit dans Cockpit pour survivre à la fermeture du panel.
  const [date, setDate] = useState('1990-06-15');
  const [time, setTime] = useState('14:30');
  // `userCity` becomes non-null once the user explicitly picks a city. While
  // it's null, `city` is derived from geolocation (Paris as a final
  // fallback) — pure derivation, no effect-based sync.
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
    // Après le JUMP : on ferme le formulaire (saisie terminée) et on
    // ouvre la fiche RÉSUMÉ par défaut. Les autres fiches restent
    // accessibles via leurs onglets respectifs.
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

  const toggleRightPanel = (key: ReportPanelKey) => {
    setActiveRight(prev => prev === key ? null : key);
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

  return (
    <div
      ref={cockpitRef}
      id="cockpit-main"
      tabIndex={-1}
      className="fixed inset-0 overflow-hidden bg-[#060210]"
    >
      <a href="#cockpit-main" className="skip-to-main">
        Aller au contenu principal
      </a>

      {/* === VUE 3D — sélection de texte désactivée (navigation globe / capture) === */}
      <div className="absolute inset-0 z-0 select-none touch-manipulation">
        <SpaceView
          ref={spaceViewRef}
          reading={reading}
          showGuides={showGuides}
          showBodyLabels={bodyLabelsEnabled}
          showSatellites={satellitesEnabled}
          orbitalSatellites={constellationOverlayEnabled ? orbitalSatellites : []}
          constellationMode={constellationMode}
          liveLatitude={city.lat}
          liveLongitude={city.lon}
        />
      </div>

      {/* === VIGNETTE BOULE DE CRISTAL === */}
      <div className="absolute inset-0 z-1 pointer-events-none crystal-vignette" />

      {/* === CADRE HUD === */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <HudFrame reading={reading} />
      </div>

      {/* === PANEL GAUCHE — formulaire natal (onglet intégré qui dépasse) === */}
      <SidePanel
        side="left"
        open={leftOpen}
        onToggle={() => setLeftOpen(v => !v)}
        label="✦ COORDONNÉES"
        panelId="panel-coordonnees"
        widthClass="w-[min(22rem,calc(100vw-2.75rem))] sm:w-88"
      >
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
      </SidePanel>

      {/* === PANELS DROITS — fiches de rapport empilées (un seul ouvert à la fois) === */}
      {RIGHT_PANELS.map(({ key, label, tabTop }) => (
        <SidePanel
          key={key}
          side="right"
          open={activeRight === key}
          tabVisible={!activeRight || activeRight === key}
          onToggle={() => toggleRightPanel(key)}
          label={label}
          panelId={`panel-${key}`}
          widthClass="w-[min(28rem,calc(100vw-2.5rem))] sm:w-[28rem]"
          tabTopClass={tabTop}
        >
          {key === 'resume' && (
            <ResumePanel reading={reading} onClose={() => setActiveRight(null)} />
          )}
          {key === 'carte' && (
            <CartePanel reading={reading} onClose={() => setActiveRight(null)} />
          )}
          {key === 'lecture' && (
            <LecturePanel
              reading={reading}
              satellitesEnabled={satellitesEnabled}
              onClose={() => setActiveRight(null)}
            />
          )}
          {key === 'donnees' && (
            <DonneesPanel reading={reading} onClose={() => setActiveRight(null)} />
          )}
        </SidePanel>
      ))}

      {/* === RAPPORT COMPLET (hors-écran) — source de l'export PNG === */}
      {reading && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-[-12000px] w-md
                     bg-[#100828] text-slate-200"
          ref={fullReportRef}
        >
          <FullReport reading={reading} />
        </div>
      )}

      {/* === CONSOLE (BAS) — caméra + affichage + audio === */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20
                   pb-[max(0,env(safe-area-inset-bottom))]
                   bg-linear-to-t from-[#060210]/98 via-[#060210]/85 to-transparent
                   backdrop-blur-md border-t border-violet-500/15"
      >
        <div className="absolute top-0 inset-x-0 h-px
                        bg-linear-to-r from-transparent via-violet-400/25 to-transparent" />
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
            // After an error, treat the click as a retry rather than a toggle.
            if (orbitalStatus === 'error') {
              retryOrbital();
              if (!constellationOverlayEnabled) setConstellationOverlayEnabled(true);
              return;
            }
            setConstellationOverlayEnabled(v => !v);
          }}
          constellationMode={constellationMode}
          onToggleConstellationMode={() =>
            setConstellationMode(m => m === 'modern' ? 'historical' : 'modern')
          }
          canUseHistoricalMode={!!reading}
          orbitalStatus={orbitalStatus}
          onFlySun={() => spaceViewRef.current?.flyToSun()}
          onFlyMoon={() => spaceViewRef.current?.flyToMoon()}
          onFlyEarth={() => spaceViewRef.current?.flyToEarth()}
          onJumpNow={handleJumpNow}
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

/**
 * Panel latéral (gauche ou droit) avec onglet intégré qui dépasse de la
 * bordure intérieure du panel. L'onglet suit le panel : ouvert, il dépasse
 * vers le centre de l'écran ; fermé, il reste collé au bord de l'écran et
 * sert de poignée pour rouvrir. Pas de bouton flottant qui gêne la vue.
 *
 * `tabTopClass` — position verticale de l'onglet le long du panel ; sert
 * à empiler plusieurs panels du même côté sans que leurs onglets se
 * chevauchent (ex. fiches de rapport à droite).
 */
function SidePanel({
  side, open, onToggle, label, panelId, widthClass, autoHeight, tabVisible = true,
  tabTopClass = 'top-1/2',
  children,
}: {
  side: 'left' | 'right';
  open: boolean;
  onToggle: () => void;
  label: string;
  panelId: string;
  widthClass: string;
  autoHeight?: boolean;
  tabVisible?: boolean;
  tabTopClass?: string;
  children: React.ReactNode;
}) {
  const isLeft = side === 'left';
  const reduceMotion = useReducedMotion();
  // Quand fermé, on translate le panel hors-écran. L'onglet, positionné
  // hors du conteneur (à `left-full` pour le gauche, `right-full` pour le
  // droit), reste alors visible au bord de l'écran.
  const closedX = isLeft ? '-100%' : '100%';

  return (
    <motion.aside
      id={panelId}
      initial={false}
      animate={{ x: open ? 0 : closedX }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 180, damping: 30 }
      }
      className={`absolute top-11 z-20 ${widthClass}
                  ${autoHeight
                    ? 'max-h-[calc(100dvh-2.75rem-6rem-env(safe-area-inset-bottom,0))]'
                    : 'bottom-[calc(6rem+env(safe-area-inset-bottom,0))]'}
                  ${isLeft ? 'left-0' : 'right-0'}
                  bg-[#100828]/95 backdrop-blur-2xl
                  border border-violet-400/30
                  ${isLeft ? 'rounded-r-sm border-l-0' : 'rounded-l-sm border-r-0'}
                  shadow-[0_8px_40px_rgba(0,0,0,0.7)]`}
    >
      {/* Onglet qui dépasse du bord intérieur. Positionné hors de la
          bounding-box du panel pour rester visible une fois le panel fermé. */}
      <Button
        onClick={onToggle}
        variant={open ? 'solid' : 'outline'}
        size="sm"
        className={cn(
          `absolute ${tabTopClass} -translate-y-1/2`,
          isLeft ? 'left-full' : 'right-full',
          'h-auto min-h-11 min-w-10 px-1.5 py-3.5 sm:min-h-0 sm:min-w-0',
          isLeft ? 'rounded-r-sm border-l-0' : 'rounded-l-sm border-r-0',
          'backdrop-blur-2xl text-[11.5px] tracking-widest font-medium transition-[opacity,colors] duration-200',
          tabVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          open
            ? 'border-violet-300/55 bg-violet-500/20 text-violet-50'
            : 'border-violet-400/30 bg-[#100828]/95 text-violet-200/85 hover:text-violet-50 hover:bg-violet-500/15 hover:border-violet-300/45',
        )}
        style={{ writingMode: 'vertical-rl' as const }}
        aria-label={`${open ? 'Fermer' : 'Ouvrir'} ${label}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span style={{ transform: isLeft ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>
          {label}
        </span>
      </Button>

      <div
        className={`${autoHeight ? 'max-h-full' : 'h-full'} min-h-0 overflow-hidden flex flex-col`}
        aria-hidden={!open}
      >
        {children}
      </div>
    </motion.aside>
  );
}
