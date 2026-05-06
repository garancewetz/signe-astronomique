import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PLANETS_META } from '../utils/astroEngine';
import { ExploreSpacePopover, InfoCircleIcon } from './ExploreSpacePopover';
import { SATELLITE_RELICS } from '../data/satellitesDB';
import { ORBITAL_CATEGORIES } from '../data/orbitalCategories';
import type { OrbitalStatus } from '../hooks/useOrbitalPopulation';
import {
  Clock,
  Download,
  FileText,
  Globe2,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  Network,
  Satellite,
  Tag,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

const iconUi = 'size-4 shrink-0';

interface Props {
  audioEnabled: boolean;
  onToggleAudio: () => void;
  guidesEnabled: boolean;
  onToggleGuides: () => void;
  bodyLabelsEnabled: boolean;
  onToggleBodyLabels: () => void;
  satellitesEnabled: boolean;
  onToggleSatellites: () => void;
  constellationOverlayEnabled: boolean;
  onToggleConstellationOverlay: () => void;
  orbitalStatus: OrbitalStatus;
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;
  onJumpNow: () => void;
  onExportView: () => void;
  exportingView: boolean;
  onExportReport: () => void;
  exportingReport: boolean;
  canExportReport: boolean;
  onToggleFullscreen: () => void;
  fullscreenActive: boolean;
}

export function ControlConsole({
  audioEnabled, onToggleAudio,
  guidesEnabled, onToggleGuides,
  bodyLabelsEnabled, onToggleBodyLabels,
  satellitesEnabled, onToggleSatellites,
  constellationOverlayEnabled, onToggleConstellationOverlay,
  orbitalStatus,
  onFlySun, onFlyMoon, onFlyEarth, onJumpNow,
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

  const orbitalLabel =
    orbitalStatus === 'loading'
      ? 'CHARGEMENT'
      : orbitalStatus === 'error'
        ? 'RETRY'
        : 'ORBITAL';
  const orbitalTooltip =
    orbitalStatus === 'error'
      ? 'Celestrak injoignable — clique pour réessayer'
      : 'Population orbitale complète en temps réel (SGP4 · Celestrak)';
  return (
    <div className="relative h-full min-h-0 flex flex-col justify-center">
      <div
        className="mx-2 sm:mx-4 mb-2 sm:mb-3 rounded-console border border-border-hud-subtle
                   bg-surface-console/88 backdrop-blur-xl shadow-cockpit-bar
                   flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-2
                   overflow-x-auto overflow-y-visible overscroll-x-contain
                   [-webkit-overflow-scrolling:touch]"
      >
        {/* CAMÉRA — fly-to actions (one-shot, no toggle state) */}
        <Cluster ariaLabel="Caméra">
          <IconButton
            onClick={onFlySun}
            tooltip="Centre la caméra sur le Soleil"
            ariaLabel="Centrer la caméra sur le Soleil"
            label="SOLEIL"
          >
            <span className="text-cockpit-glyph leading-none text-glyph-sun">☀</span>
          </IconButton>
          <IconButton
            onClick={onFlyMoon}
            tooltip="Centre la caméra sur la Lune"
            ariaLabel="Centrer la caméra sur la Lune"
            label="LUNE"
          >
            <span className="text-cockpit-glyph leading-none text-glyph-moon">☾</span>
          </IconButton>
          <IconButton
            onClick={onFlyEarth}
            tooltip="Vue orbitale par défaut — équateur, Terre centrée"
            ariaLabel="Revenir à la vue orbitale par défaut"
            label="TERRE"
          >
            <span className="text-cockpit-glyph leading-none text-glyph-earth">⊕</span>
          </IconButton>
        </Cluster>

        <Divider />

        {/* AUJOURD'HUI — primary CTA, visually elevated */}
        <IconButton
          variant="primary"
          onClick={onJumpNow}
          tooltip="Calcule et affiche le ciel à l'instant présent"
          ariaLabel="Calculer le ciel d'aujourd'hui"
          label="AUJOURD’HUI"
        >
          <NowIcon />
        </IconButton>

        <Divider />

        {/* ANNOTATIONS — décorations sur la sphère (amber = on-globe markers) */}
        <Cluster ariaLabel="Annotations">
          <IconButton
            active={guidesEnabled}
            activeColor="amber"
            onClick={onToggleGuides}
            tooltip="Repères du ciel : axe terrestre, équateur céleste, écliptique"
            ariaLabel="Afficher ou masquer les repères du ciel"
            label="REPÈRES"
          >
            <GuidesIcon />
          </IconButton>
          <IconButton
            active={bodyLabelsEnabled}
            activeColor="amber"
            onClick={onToggleBodyLabels}
            tooltip="Affiche les noms du Soleil, de la Lune, des planètes et des constellations"
            ariaLabel="Afficher ou masquer les noms des astres sur la sphère"
            label="NOMS"
          >
            <LabelsIcon />
          </IconButton>
          <IconButton
            active={legendOpen}
            activeColor="amber"
            onClick={() => setLegendOpen(v => !v)}
            tooltip="Affiche la signification des symboles et des couleurs"
            ariaLabel="Ouvrir ou fermer la légende des symboles"
            label="LÉGENDE"
          >
            <LegendIcon />
          </IconButton>
        </Cluster>

        <Divider />

        {/* SATELLITES — couches data (sky = orbital data layers) */}
        <Cluster ariaLabel="Satellites">
          <IconButton
            active={satellitesEnabled}
            activeColor="sky"
            onClick={onToggleSatellites}
            tooltip="Reliques orbitales — satellites historiques visibles à la date natale (Spoutnik, Hubble, ISS…)"
            ariaLabel="Activer ou désactiver les reliques orbitales"
            label="RELIQUES"
          >
            <SatelliteIcon />
          </IconButton>
          <IconButton
            active={constellationOverlayEnabled}
            activeColor="sky"
            onClick={onToggleConstellationOverlay}
            tooltip={orbitalTooltip}
            ariaLabel="Activer ou désactiver la population orbitale en temps réel"
            label={orbitalLabel}
            minWidthClass="min-w-[9.5rem]"
          >
            {orbitalStatus === 'loading' ? <Spinner /> : <ConstellationOverlayIcon />}
          </IconButton>
        </Cluster>

        <Divider />

        {/* EXPORTS */}
        <Cluster ariaLabel="Exports">
          <IconButton
            onClick={onExportView}
            disabled={exportingView}
            tooltip="Enregistre la vue 3D actuelle dans un fichier image PNG"
            ariaLabel="Exporter la vue 3D en image PNG"
          >
            {exportingView ? <Spinner /> : <DownloadIcon />}
          </IconButton>
          <IconButton
            onClick={onExportReport}
            disabled={!canExportReport || exportingReport}
            tooltip={
              canExportReport
                ? 'Enregistre la vue 3D et le rapport complet dans un fichier PNG'
                : 'Calcule d\'abord un thème natal pour exporter le rapport complet'
            }
            ariaLabel="Exporter la vue 3D et le rapport complet en PNG"
            label={exportingReport ? 'CAPTURE' : 'RAPPORT'}
            minWidthClass="min-w-[7.5rem]"
          >
            {exportingReport ? <Spinner /> : <ReportIcon />}
          </IconButton>
        </Cluster>

        <div className="flex-1 min-w-2" />

        {/* AIDE & RÉGLAGES — secondaires */}
        <Cluster ariaLabel="Aide et réglages">
          <IconButton
            active={exploreOpen}
            activeColor="sky"
            onClick={() => setExploreOpen(v => !v)}
            tooltip="Ressources externes : cartes du ciel, éphémérides, vulgarisation…"
            ariaLabel="Ouvrir la liste de liens utiles"
          >
            <InfoCircleIcon />
          </IconButton>
          <IconButton
            active={fullscreenActive}
            activeColor="sky"
            onClick={onToggleFullscreen}
            tooltip={fullscreenActive ? 'Quitter le plein écran' : 'Passer en plein écran'}
            ariaLabel={fullscreenActive ? 'Quitter le plein écran' : 'Passer en plein écran'}
          >
            {fullscreenActive ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
          <IconButton
            active={audioEnabled}
            activeColor="emerald"
            onClick={onToggleAudio}
            tooltip={audioEnabled ? 'Couper le son' : 'Activer le son'}
            ariaLabel={audioEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {audioEnabled ? <SpeakerOn /> : <SpeakerOff />}
          </IconButton>
        </Cluster>
      </div>

      <LegendDock
        open={legendOpen}
        onClose={() => setLegendOpen(false)}
        guidesEnabled={guidesEnabled}
        onToggleGuides={onToggleGuides}
        bodyLabelsEnabled={bodyLabelsEnabled}
        onToggleBodyLabels={onToggleBodyLabels}
        satellitesEnabled={satellitesEnabled}
        onToggleSatellites={onToggleSatellites}
        constellationOverlayEnabled={constellationOverlayEnabled}
        onToggleConstellationOverlay={onToggleConstellationOverlay}
        orbitalStatus={orbitalStatus}
      />
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
      className="shrink-0 h-8 w-px bg-linear-to-b from-transparent via-violet-300/25 to-transparent"
    />
  );
}

type ActiveColor = 'amber' | 'violet' | 'sky' | 'emerald';
type ButtonVariant = 'primary' | 'default';

function IconButton({
  children, onClick, tooltip, ariaLabel,
  active, activeColor = 'violet', disabled = false, label,
  variant = 'default',
  minWidthClass,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tooltip: string;
  ariaLabel: string;
  /** Omit for one-shot action buttons; pass a boolean only for real toggles. */
  active?: boolean;
  activeColor?: ActiveColor;
  disabled?: boolean;
  label?: string;
  variant?: ButtonVariant;
  /** Override min-width for buttons whose label changes (avoids layout shift). */
  minWidthClass?: string;
}) {
  const activeClasses =
    activeColor === 'amber'
      ? 'border-amber-300/65 text-amber-100 bg-amber-400/14 shadow-[0_0_0_1px_rgba(251,191,36,0.15)_inset]'
      : activeColor === 'sky'
        ? 'border-sky-300/65 text-sky-100 bg-sky-400/14 shadow-[0_0_0_1px_rgba(56,189,248,0.14)_inset]'
        : activeColor === 'emerald'
          ? 'border-emerald-300/65 text-emerald-100 bg-emerald-400/12 shadow-[0_0_0_1px_rgba(52,211,153,0.14)_inset]'
          : 'border-violet-300/65 text-violet-100 bg-violet-500/16 shadow-[0_0_0_1px_rgba(167,139,250,0.14)_inset]';

  const inactive =
    variant === 'primary'
      ? 'border-violet-300/60 text-violet-50 bg-violet-500/22 hover:bg-violet-500/32 hover:border-violet-200/80 shadow-[0_0_0_1px_rgba(167,139,250,0.18)_inset]'
      : 'border-border-hud-subtle text-slate-300/90 bg-transparent hover:border-accent-label/55 hover:text-slate-100 hover:bg-violet-500/10';

  const sizing = label
    ? 'inline-flex items-center justify-center gap-2 h-11 px-3.5 text-cockpit-sm tracking-cockpit-wide'
    : 'grid place-items-center h-11 w-11';

  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      {...(active !== undefined && { 'aria-pressed': active })}
      disabled={disabled}
      className={`cockpit-focus shrink-0 ${sizing} ${minWidthClass ?? ''} rounded-md border transition-[colors,transform,box-shadow] duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
                  enabled:active:scale-[0.98]
                  ${active === true ? activeClasses : inactive}`}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );

  return <TooltipWrap text={tooltip}>{button}</TooltipWrap>;
}

/* ───── Tooltip — portail body + fixed (évite le clip overflow-x de la barre + pas de 2ᵉ flex item) ───── */

function TooltipWrap({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const updatePos = () => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ left: rect.left + rect.width / 2, top: rect.top - 8 });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onMove = () => updatePos();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  const showTooltip = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      updatePos();
      setOpen(true);
    }, 250);
  };

  const hideTooltip = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(false);
    setPos(null);
  };

  const tooltip =
    open &&
    pos &&
    typeof document !== 'undefined' &&
    createPortal(
      <span
        aria-hidden="true"
        style={{ left: pos.left, top: pos.top }}
        className="pointer-events-none fixed z-100 -translate-x-1/2 -translate-y-full
                   whitespace-normal max-w-[min(18rem,calc(100vw-2rem))] text-balance text-center
                   bg-surface-raised/95 backdrop-blur-md
                   border border-border-hud-strong rounded-md shadow-cockpit-modal
                   px-2.5 py-1.5 text-cockpit-xs tracking-cockpit leading-snug
                   text-slate-200"
      >
        {text}
      </span>,
      document.body,
    );

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {tooltip}
    </span>
  );
}

/* ─────────────────────────── légende (popover) ─────────────────────────── */

function LegendDock({
  open,
  onClose,
  guidesEnabled,
  onToggleGuides,
  bodyLabelsEnabled,
  onToggleBodyLabels,
  satellitesEnabled,
  onToggleSatellites,
  constellationOverlayEnabled,
  onToggleConstellationOverlay,
  orbitalStatus,
}: {
  open: boolean;
  onClose: () => void;
  guidesEnabled: boolean;
  onToggleGuides: () => void;
  bodyLabelsEnabled: boolean;
  onToggleBodyLabels: () => void;
  satellitesEnabled: boolean;
  onToggleSatellites: () => void;
  constellationOverlayEnabled: boolean;
  onToggleConstellationOverlay: () => void;
  orbitalStatus: OrbitalStatus;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed z-40 left-3 max-w-[calc(100vw-1.5rem)]
                 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0))]"
    >
      <div className="pointer-events-auto">
        <AnimatePresence>
          {open && (
            <LegendExpandedPanel
              key="open"
              onClose={onClose}
              reduceMotion={!!reduceMotion}
              guidesEnabled={guidesEnabled}
              onToggleGuides={onToggleGuides}
              bodyLabelsEnabled={bodyLabelsEnabled}
              onToggleBodyLabels={onToggleBodyLabels}
              satellitesEnabled={satellitesEnabled}
              onToggleSatellites={onToggleSatellites}
              constellationOverlayEnabled={constellationOverlayEnabled}
              onToggleConstellationOverlay={onToggleConstellationOverlay}
              orbitalStatus={orbitalStatus}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LegendExpandedPanel({
  onClose,
  reduceMotion,
  guidesEnabled,
  onToggleGuides,
  bodyLabelsEnabled,
  onToggleBodyLabels,
  satellitesEnabled,
  onToggleSatellites,
  constellationOverlayEnabled,
  onToggleConstellationOverlay,
  orbitalStatus,
}: {
  onClose: () => void;
  reduceMotion: boolean;
  guidesEnabled: boolean;
  onToggleGuides: () => void;
  bodyLabelsEnabled: boolean;
  onToggleBodyLabels: () => void;
  satellitesEnabled: boolean;
  onToggleSatellites: () => void;
  constellationOverlayEnabled: boolean;
  onToggleConstellationOverlay: () => void;
  orbitalStatus: OrbitalStatus;
}) {
  const planetEntries = Object.values(PLANETS_META);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cockpit-legend-title"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
      transition={{ duration: reduceMotion ? 0 : 0.22 }}
      style={{ transformOrigin: 'bottom left' }}
      className="w-[min(18rem,calc(100vw-1.5rem))] max-h-[min(56vh,26rem)] overflow-y-auto overscroll-contain
                 bg-surface-raised/95 backdrop-blur-xl
                 border border-border-hud-strong rounded-md
                 shadow-cockpit-modal p-4"
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div id="cockpit-legend-title" className="text-cockpit-sm tracking-cockpit-caps text-accent-label">
          LÉGENDE
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cockpit-focus shrink-0 inline-flex items-center gap-2 h-8 px-2 rounded-md border border-border-hud
                     text-slate-400 hover:text-white hover:bg-violet-500/15 transition"
          aria-label="Réduire la légende"
        >
          <X className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden />
          <span className="text-cockpit-sm tracking-cockpit">FERMER</span>
        </button>
      </div>

      <div className="space-y-3 text-cockpit-sm">
        <Section
          title="ASTRES"
          action={
            <LegendToggle
              active={bodyLabelsEnabled}
              onClick={onToggleBodyLabels}
              label="NOMS"
              ariaLabel="Afficher ou masquer les noms des astres sur la sphère"
            />
          }
        >
          <Row glyph="☀" color="#fcd34d" name="Soleil" />
          <Row glyph="☾" color="#e2e8f0" name="Lune" />
          {planetEntries.map(p => (
            <Row key={p.id} glyph={p.glyph} color={p.color} name={p.fr} />
          ))}
        </Section>

        <Section
          title="REPÈRES (guides ⊕)"
          action={
            <LegendToggle
              active={guidesEnabled}
              onClick={onToggleGuides}
              label="AFFICHER"
              ariaLabel="Afficher ou masquer les repères du ciel"
            />
          }
        >
          <LineRow color="#fde68a" label="Axe terrestre (rotation)" />
          <LineRow color="#60a5fa" label="Équateur céleste" />
          <LineRow color="#fbbf24" label="Écliptique (chemin du Soleil)" />
        </Section>

        <Section
          title="RELIQUES ORBITALES"
          action={
            <LegendToggle
              active={satellitesEnabled}
              onClick={onToggleSatellites}
              label="AFFICHER"
              ariaLabel="Afficher ou masquer les reliques orbitales"
            />
          }
        >
          {SATELLITE_RELICS.map((r) => (
            <DotRow
              key={r.id}
              color={r.glowColor}
              label={r.name}
              year={new Date(r.launchDate).getUTCFullYear()}
            />
          ))}
        </Section>

        <Section
          title="CONSTELLATION_OVERLAY"
          action={
            orbitalStatus !== 'error' ? (
              <LegendToggle
                active={constellationOverlayEnabled}
                onClick={onToggleConstellationOverlay}
                label="AFFICHER"
                ariaLabel="Afficher ou masquer la population orbitale en temps réel"
              />
            ) : (
              <span className="text-cockpit-xs tracking-cockpit text-red-400/80">ERREUR</span>
            )
          }
        >
          {Object.values(ORBITAL_CATEGORIES).map((cat) => (
            <DotRow key={cat.label} color={cat.hex} label={cat.label} note="temps réel" />
          ))}
          {orbitalStatus === 'loading' && (
            <div className="text-slate-500 text-cockpit-sm tracking-normal">
              Chargement Celestrak…
            </div>
          )}
          {orbitalStatus === 'error' && (
            <div className="text-red-400/80 text-cockpit-sm tracking-normal">
              Impossible de joindre Celestrak.
            </div>
          )}
        </Section>
      </div>
    </motion.div>
  );
}

function DotRow({
  color,
  label,
  year,
  note,
}: {
  color: string;
  label: string;
  year?: number;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="shrink-0 inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="text-slate-300 truncate">{label}</span>
      {note && <span className="text-slate-500 ml-auto text-cockpit-sm shrink-0">{note}</span>}
      {year !== undefined && !note && <span className="text-slate-500 ml-auto text-cockpit-sm">{year}</span>}
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="text-cockpit-xs tracking-cockpit-caps text-accent-label/70">
          {title}
        </div>
        {action}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function LegendToggle({
  active,
  onClick,
  label,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`cockpit-focus shrink-0 inline-flex items-center gap-1.5 h-6 pl-1 pr-2 rounded
                  border text-cockpit-xs tracking-cockpit transition-colors
                  ${active
                    ? 'border-amber-300/60 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15'
                    : 'border-border-hud bg-transparent text-slate-400 hover:border-accent-label/45 hover:text-slate-200'}`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-block w-5 h-2.5 rounded-full transition-colors
                    ${active ? 'bg-amber-300/70' : 'bg-slate-600/60'}`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow transition-[left]
                      ${active ? 'left-[calc(100%-0.5rem-1px)]' : 'left-px'}`}
        />
      </span>
      <span>{label}</span>
    </button>
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

/* ─────────────────────────── icons (Lucide) ─────────────────────────── */

function GuidesIcon() {
  return <Globe2 className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function LegendIcon() {
  return <List className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function LabelsIcon() {
  return <Tag className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function ConstellationOverlayIcon() {
  return <Network className={iconUi} strokeWidth={1.2} aria-hidden />;
}

function SatelliteIcon() {
  return <Satellite className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function FullscreenIcon() {
  return <Maximize2 className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function FullscreenExitIcon() {
  return <Minimize2 className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function DownloadIcon() {
  return <Download className={iconUi} strokeWidth={1.4} aria-hidden />;
}

function ReportIcon() {
  return <FileText className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function Spinner() {
  return (
    <Loader2
      className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none"
      strokeWidth={1.6}
      aria-hidden
    />
  );
}

function SpeakerOn() {
  return <Volume2 className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function SpeakerOff() {
  return <VolumeX className={iconUi} strokeWidth={1.35} aria-hidden />;
}

function NowIcon() {
  return <Clock className={iconUi} strokeWidth={1.35} aria-hidden />;
}
