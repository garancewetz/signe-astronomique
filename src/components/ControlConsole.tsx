import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { CelestialReading } from '../utils/astroEngine';
import { PLANETS_META } from '../utils/astroEngine';
import { ExploreSpacePopover, InfoCircleIcon } from './ExploreSpacePopover';

interface Props {
  reading: CelestialReading | null;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  guidesEnabled: boolean;
  onToggleGuides: () => void;
  bodyLabelsEnabled: boolean;
  onToggleBodyLabels: () => void;
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;
  onExportView: () => void;
  exportingView: boolean;
  onExportReport: () => void;
  exportingReport: boolean;
  canExportReport: boolean;
  onToggleFullscreen: () => void;
  fullscreenActive: boolean;
}

export function ControlConsole({
  reading,
  audioEnabled, onToggleAudio,
  guidesEnabled, onToggleGuides,
  bodyLabelsEnabled, onToggleBodyLabels,
  onFlySun, onFlyMoon, onFlyEarth,
  onExportView,
  exportingView,
  onExportReport,
  exportingReport,
  canExportReport,
  onToggleFullscreen,
  fullscreenActive,
}: Props) {
  const [legendOpen, setLegendOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [liveNow, setLiveNow] = useState(() => new Date());
  useEffect(() => {
    if (reading) return;
    const id = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [reading]);

  const natalUtcLine = reading
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(reading.input.date) + ' UTC'
    : null;

  const liveLine = !reading
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(liveNow)
    : null;

  return (
    <div className="relative h-full min-h-0 flex flex-col justify-center">
      <div
        className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2.5 overflow-x-auto overflow-y-visible
                   overscroll-x-contain [-webkit-overflow-scrolling:touch]"
      >
        <StatusBlock
          reading={reading}
          natalUtcLine={natalUtcLine}
          liveLine={liveLine}
        />

        <Divider />

        {/* CAMÉRA */}
        <Cluster ariaLabel="Caméra">
          <IconButton
            onClick={onFlySun}
            title="Centrer la caméra sur le Soleil"
            ariaLabel="Centrer la caméra sur le Soleil"
            label="SOLEIL"
          >
            <span style={{ color: '#fcd34d' }} className="text-[15px] leading-none">☀</span>
          </IconButton>
          <IconButton
            onClick={onFlyMoon}
            title="Centrer la caméra sur la Lune"
            ariaLabel="Centrer la caméra sur la Lune"
            label="LUNE"
          >
            <span style={{ color: '#e2e8f0' }} className="text-[15px] leading-none">☾</span>
          </IconButton>
          <IconButton
            onClick={onFlyEarth}
            title="Vue orbitale par défaut — équateur, Terre centrée"
            ariaLabel="Revenir à la vue orbitale par défaut"
            label="TERRE"
          >
            <span style={{ color: '#7dd3fc' }} className="text-[15px] leading-none">⊕</span>
          </IconButton>
        </Cluster>

        <Divider />

        {/* AFFICHAGE */}
        <Cluster ariaLabel="Affichage">
          <IconButton
            active={guidesEnabled}
            activeColor="amber"
            onClick={onToggleGuides}
            title="Repères du ciel : axe terrestre, équateur céleste, écliptique"
            ariaLabel="Afficher ou masquer les repères du ciel"
            label="REPÈRES"
          >
            <GuidesIcon />
          </IconButton>
          <IconButton
            active={bodyLabelsEnabled}
            activeColor="amber"
            onClick={onToggleBodyLabels}
            title="Affiche ou masque les noms du Soleil, de la Lune, des planètes et des constellations sur la vue 3D"
            ariaLabel="Afficher ou masquer les noms des astres sur la sphère"
            label="NOMS"
          >
            <LabelsIcon />
          </IconButton>
        </Cluster>

        <Divider />

        {/* OUTILS */}
        <Cluster ariaLabel="Outils">
          <IconButton
            active={exploreOpen}
            activeColor="sky"
            onClick={() => setExploreOpen(v => !v)}
            title="Ressources externes : cartes du ciel, éphémérides, vulgarisation…"
            ariaLabel="Ouvrir la liste de liens utiles"
            label="LIENS"
          >
            <InfoCircleIcon />
          </IconButton>
          <IconButton
            active={fullscreenActive}
            activeColor="sky"
            onClick={onToggleFullscreen}
            title={fullscreenActive ? 'Quitter le plein écran' : 'Plein écran'}
            ariaLabel={fullscreenActive ? 'Quitter le plein écran' : 'Passer en plein écran'}
            label={fullscreenActive ? 'QUITTER' : 'ÉCRAN'}
          >
            {fullscreenActive ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
          <IconButton
            onClick={onExportView}
            disabled={exportingView}
            title="Enregistrer la vue 3D actuelle dans un fichier image (PNG)"
            ariaLabel="Exporter la vue 3D en image PNG"
            label={exportingView ? 'CAPTURE' : 'IMAGE'}
          >
            {exportingView ? <Spinner /> : <DownloadIcon />}
          </IconButton>
          <IconButton
            onClick={onExportReport}
            disabled={!canExportReport || exportingReport}
            title="Enregistrer la vue 3D et le rapport complet dans un fichier PNG"
            ariaLabel="Exporter la vue 3D et le rapport complet en PNG"
            label={exportingReport ? 'CAPTURE' : 'RAPPORT'}
          >
            {exportingReport ? <Spinner /> : <ReportIcon />}
          </IconButton>
        </Cluster>

        <div className="flex-1 min-w-2" />

        {/* AUDIO (secondaire) */}
        <IconButton
          active={audioEnabled}
          activeColor="emerald"
          onClick={onToggleAudio}
          title={audioEnabled ? 'Couper le son' : 'Activer le son'}
          ariaLabel={audioEnabled ? 'Couper le son' : 'Activer le son'}
          label="SON"
        >
          {audioEnabled ? <SpeakerOn /> : <SpeakerOff />}
        </IconButton>
      </div>

      <LegendDock open={legendOpen} onOpenChange={setLegendOpen} />
      <AnimatePresence>
        {exploreOpen && (
          <ExploreSpacePopover onClose={() => setExploreOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function Cluster({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex items-center gap-1 shrink-0">
      {children}
    </div>
  );
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 h-7 w-px bg-linear-to-b from-transparent via-violet-400/25 to-transparent"
    />
  );
}

type ActiveColor = 'amber' | 'violet' | 'sky' | 'emerald';

function IconButton({
  children, onClick, title, ariaLabel,
  active = false, activeColor = 'violet', disabled = false, label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  ariaLabel: string;
  active?: boolean;
  activeColor?: ActiveColor;
  disabled?: boolean;
  label?: string;
}) {
  const activeClasses =
    activeColor === 'amber'
      ? 'border-amber-400/55 text-amber-200 bg-amber-500/12'
      : activeColor === 'sky'
        ? 'border-sky-400/55 text-sky-100 bg-sky-500/12'
        : activeColor === 'emerald'
          ? 'border-emerald-400/55 text-emerald-200 bg-emerald-500/10'
          : 'border-violet-300/60 text-violet-100 bg-violet-500/15';

  const inactive =
    'border-violet-400/20 text-slate-400 hover:border-violet-300/55 hover:text-slate-100 hover:bg-violet-500/10';

  const sizing = label
    ? 'inline-flex items-center gap-2 h-9 px-3 text-[10px] tracking-[0.22em]'
    : 'grid place-items-center h-9 w-9';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      className={`cockpit-focus shrink-0 ${sizing} rounded-md border transition
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${active ? activeClasses : inactive}`}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );
}

function StatusBlock({
  reading, natalUtcLine, liveLine,
}: {
  reading: CelestialReading | null;
  natalUtcLine: string | null;
  liveLine: string | null;
}) {
  const isNatal = !!reading;
  const mode = isNatal ? 'CIEL NATAL' : 'CIEL EN DIRECT';
  const main = reading
    ? `${reading.trueConstellation} · ${reading.moon.constellation}`
    : 'En attente de tes coordonnées';
  const sub = reading
    ? `${reading.input.placeLabel ?? 'Ciel natal'} · ${natalUtcLine}`
    : `Ciel actuel · ${liveLine}`;

  return (
    <div
      className="flex shrink-0 items-center gap-2.5 min-w-0
                 max-w-[46vw] sm:max-w-none sm:min-w-56"
    >
      <span
        aria-hidden="true"
        className={`shrink-0 w-1.5 h-1.5 rounded-full animate-shimmer
                    ${isNatal ? 'bg-violet-400' : 'bg-emerald-400/85'}`}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2 leading-tight min-w-0">
          <span className="shrink-0 text-[8px] tracking-[0.28em] uppercase text-violet-300/85">
            {mode}
          </span>
          <span className="text-[10px] tracking-[0.04em] text-slate-200 truncate">
            {main}
          </span>
        </div>
        <div className="text-[8px] tracking-[0.06em] text-slate-500 truncate mt-0.5">
          {sub}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── légende (coin bas-gauche) ─────────────────────────── */

function LegendDock({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed z-40 left-3 max-w-[calc(100vw-1.5rem)]
                 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="pointer-events-auto flex flex-col items-start gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <LegendExpandedPanel key="open" onClose={() => onOpenChange(false)} reduceMotion={!!reduceMotion} />
          ) : (
            <LegendCollapsedTrigger key="closed" onOpen={() => onOpenChange(true)} reduceMotion={!!reduceMotion} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LegendCollapsedTrigger({
  onOpen,
  reduceMotion,
}: {
  onOpen: () => void;
  reduceMotion: boolean;
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.92 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      onClick={onOpen}
      title="Symboles du Soleil, de la Lune, des planètes et des repères du ciel"
      aria-label="Ouvrir la légende des symboles"
      className="cockpit-focus inline-flex items-center gap-2 h-9 pl-2.5 pr-3 rounded-md
                 border border-violet-400/40 bg-[#100828]/90 backdrop-blur-md
                 text-slate-200 text-[9px] tracking-[0.22em] shadow-[0_4px_24px_rgba(0,0,0,0.45)]
                 hover:border-violet-300/60 hover:bg-violet-500/15 transition-colors"
    >
      <LegendIcon />
      <span>LÉGENDE</span>
    </motion.button>
  );
}

function LegendExpandedPanel({
  onClose,
  reduceMotion,
}: {
  onClose: () => void;
  reduceMotion: boolean;
}) {
  const planetEntries = Object.values(PLANETS_META);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cockpit-legend-title"
      layout
      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.94, y: reduceMotion ? 0 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.94, y: reduceMotion ? 0 : 6 }}
      transition={{ duration: reduceMotion ? 0 : 0.22 }}
      style={{ transformOrigin: 'bottom left' }}
      className="w-[min(18rem,calc(100vw-1.5rem))] max-h-[min(56vh,26rem)] overflow-y-auto overscroll-contain
                 bg-[#100828]/95 backdrop-blur-xl
                 border border-violet-400/35 rounded-md
                 shadow-[0_12px_44px_rgba(0,0,0,0.75)] p-4"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div id="cockpit-legend-title" className="text-[9px] tracking-[0.3em] text-violet-300">
          LÉGENDE
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cockpit-focus shrink-0 inline-flex items-center gap-2 h-8 px-2 rounded-md border border-violet-400/25
                     text-slate-400 hover:text-white hover:bg-violet-500/15 transition"
          aria-label="Réduire la légende"
        >
          <CloseIcon />
          <span className="text-[9px] tracking-[0.2em]">FERMER</span>
        </button>
      </div>

      <div className="space-y-3 text-[10px]">
        <Section title="ASTRES">
          <Row glyph="☀" color="#fcd34d" name="Soleil" />
          <Row glyph="☾" color="#e2e8f0" name="Lune" />
          {planetEntries.map(p => (
            <Row key={p.id} glyph={p.glyph} color={p.color} name={p.fr} />
          ))}
        </Section>

        <Section title="REPÈRES (guides ⊕)">
          <LineRow color="#fde68a" label="Axe terrestre (rotation)" />
          <LineRow color="#60a5fa" label="Équateur céleste" />
          <LineRow color="#fbbf24" label="Écliptique (chemin du Soleil)" />
        </Section>
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[8px] tracking-[0.3em] text-violet-400/70 mb-1.5">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ glyph, color, name }: { glyph: string; color: string; name: string }) {
  return (
    <div className="flex items-center gap-3 font-mono">
      <span style={{ color }} className="text-base leading-none w-5 text-center">
        {glyph}
      </span>
      <span className="text-slate-300">{name}</span>
    </div>
  );
}

function LineRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="20" height="6" viewBox="0 0 20 6" className="shrink-0">
        <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="1.5" />
      </svg>
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

/* ─────────────────────────── icons ─────────────────────────── */

function GuidesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="9" cy="9" r="6.5" />
      <line x1="2.5" y1="9" x2="15.5" y2="9" />
      <line x1="3.2" y1="11.5" x2="14.8" y2="6.5" strokeDasharray="1.5 1.2" />
      <line x1="9" y1="2.5" x2="9" y2="15.5" strokeOpacity="0.5" />
    </svg>
  );
}

function LegendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="4.5" cy="5" r="1.3" />
      <line x1="7.5" y1="5" x2="14.5" y2="5" strokeLinecap="round" />
      <circle cx="4.5" cy="9" r="1.3" />
      <line x1="7.5" y1="9" x2="14.5" y2="9" strokeLinecap="round" />
      <circle cx="4.5" cy="13" r="1.3" />
      <line x1="7.5" y1="13" x2="14.5" y2="13" strokeLinecap="round" />
    </svg>
  );
}

function LabelsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <circle cx="6" cy="6" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}


function FullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M3 7V3h4M11 3h4v4M3 11v4h4M15 11v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FullscreenExitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M7 3H3v4M11 3h4v4M7 15H3v-4M11 15h4v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2 L8 10" />
      <path d="M5 7 L8 10 L11 7" />
      <path d="M3 12 L3 13.5 L13 13.5 L13 12" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2.5" width="9" height="13" rx="1" />
      <path d="M5.5 6h4M5.5 9h5M5.5 12h3" />
      <path d="M12 4.5l3 1.2v8.5l-3-1.2" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="animate-spin"
    >
      <circle cx="8" cy="8" r="6" strokeOpacity="0.25" />
      <path d="M14 8 A6 6 0 0 0 8 2" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerOn() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M3 6h3l4-3v12l-4-3H3z" strokeLinejoin="round" />
      <path d="M12 6.5c1 .8 1 4.2 0 5" strokeLinecap="round" />
      <path d="M14 4.5c2 1.5 2 7.5 0 9" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M3 6h3l4-3v12l-4-3H3z" strokeLinejoin="round" />
      <path d="M12 6 l4 6 M16 6 l-4 6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0" aria-hidden>
      <path d="M5 5l8 8M13 5l-8 8" strokeLinecap="round" />
    </svg>
  );
}
