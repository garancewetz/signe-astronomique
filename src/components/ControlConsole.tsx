import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PLANETS_META } from '../utils/astroEngine';
import { ExploreSpacePopover, InfoCircleIcon } from './ExploreSpacePopover';
import { SATELLITE_RELICS } from '../data/satellitesDB';
import { ORBITAL_CATEGORIES } from '../data/orbitalCategories';
import type { OrbitalStatus } from '../hooks/useOrbitalPopulation';

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
  constellationMode: 'modern' | 'historical';
  onToggleConstellationMode: () => void;
  /** True when a natal reading is active — enables Historical View mode. */
  canUseHistoricalMode: boolean;
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
  constellationMode, onToggleConstellationMode, canUseHistoricalMode,
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

  return (
    <div className="relative h-full min-h-0 flex flex-col justify-center">
      <div
        className="mx-2 sm:mx-4 mb-2 sm:mb-3 rounded-xl border border-violet-400/20
                   bg-[#09031a]/88 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                   flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-2
                   overflow-x-auto overflow-y-visible overscroll-x-contain
                   [-webkit-overflow-scrolling:touch]"
      >
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
          <IconButton
            active={satellitesEnabled}
            activeColor="sky"
            onClick={onToggleSatellites}
            title="Reliques orbitales — satellites historiques visibles à la date natale (Spoutnik, Hubble, ISS…)"
            ariaLabel="Activer ou désactiver les reliques orbitales"
            label="RELIQUES"
          >
            <SatelliteIcon />
          </IconButton>
          <IconButton
            active={constellationOverlayEnabled}
            activeColor="sky"
            onClick={onToggleConstellationOverlay}
            title={
              orbitalStatus === 'error'
                ? 'Celestrak injoignable — cliquez pour réessayer'
                : 'Constellation Overlay — Population orbitale complète en temps réel (SGP4 · Celestrak)'
            }
            ariaLabel="Activer ou désactiver la population orbitale en temps réel"
            label={
              orbitalStatus === 'loading'
                ? 'CHARGEMENT'
                : orbitalStatus === 'error'
                  ? 'RETRY'
                  : 'ORBITAL'
            }
          >
            {orbitalStatus === 'loading' ? <Spinner /> : <ConstellationOverlayIcon />}
          </IconButton>
          {constellationOverlayEnabled && canUseHistoricalMode && (
            <IconButton
              active={constellationMode === 'historical'}
              activeColor="amber"
              onClick={onToggleConstellationMode}
              title={
                constellationMode === 'historical'
                  ? 'Vue Naissance — uniquement les satellites existants à la date natale'
                  : 'Vue Actuelle — tous les satellites actifs aujourd\'hui'
              }
              ariaLabel="Basculer entre vue naissance et vue actuelle"
              label={constellationMode === 'historical' ? 'NAISSANCE' : 'ACTUEL'}
            >
              <HistoricalModeIcon />
            </IconButton>
          )}
        </Cluster>

        <Divider />

        {/* OUTILS */}
        <Cluster ariaLabel="Outils">
          <IconButton
            onClick={onJumpNow}
            title="Calculer et afficher le ciel à l'instant présent"
            ariaLabel="Calculer le ciel d'aujourd'hui"
            label="AUJOURD’HUI"
          >
            <NowIcon />
          </IconButton>
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
        <Cluster ariaLabel="Réglages rapides">
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
            active={audioEnabled}
            activeColor="emerald"
            onClick={onToggleAudio}
            title={audioEnabled ? 'Couper le son' : 'Activer le son'}
            ariaLabel={audioEnabled ? 'Couper le son' : 'Activer le son'}
            label="SON"
          >
            {audioEnabled ? <SpeakerOn /> : <SpeakerOff />}
          </IconButton>
        </Cluster>
      </div>

      <LegendDock
        open={legendOpen}
        onOpenChange={setLegendOpen}
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
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex items-center gap-1 shrink-0 rounded-lg border border-violet-400/20
                 bg-[#100828]/65 px-1 py-1"
    >
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
      ? 'border-amber-300/65 text-amber-100 bg-amber-400/14 shadow-[0_0_0_1px_rgba(251,191,36,0.15)_inset]'
      : activeColor === 'sky'
        ? 'border-sky-300/65 text-sky-100 bg-sky-400/14 shadow-[0_0_0_1px_rgba(56,189,248,0.14)_inset]'
        : activeColor === 'emerald'
          ? 'border-emerald-300/65 text-emerald-100 bg-emerald-400/12 shadow-[0_0_0_1px_rgba(52,211,153,0.14)_inset]'
          : 'border-violet-300/65 text-violet-100 bg-violet-500/16 shadow-[0_0_0_1px_rgba(167,139,250,0.14)_inset]';

  const inactive =
    'border-violet-400/20 text-slate-300/90 bg-transparent hover:border-violet-300/55 hover:text-slate-100 hover:bg-violet-500/10';

  const sizing = label
    ? 'inline-flex items-center gap-2 h-9.5 px-3 text-[10px] tracking-[0.22em]'
    : 'grid place-items-center h-9.5 w-9.5';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      className={`cockpit-focus shrink-0 ${sizing} rounded-md border transition-[colors,transform,box-shadow] duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
                  enabled:active:scale-[0.98]
                  ${active ? activeClasses : inactive}`}
    >
      {children}
      {label && <span>{label}</span>}
    </button>
  );
}

/* ─────────────────────────── légende (coin bas-gauche) ─────────────────────────── */

function LegendDock({
  open,
  onOpenChange,
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
  onOpenChange: (open: boolean) => void;
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
                 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0))]"
    >
      <div className="pointer-events-auto flex flex-col items-start gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <LegendExpandedPanel
              key="open"
              onClose={() => onOpenChange(false)}
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
              <span className="text-[8px] tracking-[0.2em] text-red-400/80">ERREUR</span>
            )
          }
        >
          {Object.values(ORBITAL_CATEGORIES).map((cat) => (
            <DotRow key={cat.label} color={cat.hex} label={cat.label} note="temps réel" />
          ))}
          {orbitalStatus === 'loading' && (
            <div className="text-slate-500 text-[9px] tracking-[0.15em]">
              Chargement Celestrak…
            </div>
          )}
          {orbitalStatus === 'error' && (
            <div className="text-red-400/80 text-[9px] tracking-[0.15em]">
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
      {note && <span className="text-slate-500 ml-auto text-[9px] shrink-0">{note}</span>}
      {year !== undefined && !note && <span className="text-slate-500 ml-auto text-[9px]">{year}</span>}
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
        <div className="text-[8px] tracking-[0.3em] text-violet-400/70">
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
                  border text-[8px] tracking-[0.2em] transition-colors
                  ${active
                    ? 'border-amber-300/60 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15'
                    : 'border-violet-400/25 bg-transparent text-slate-400 hover:border-violet-300/45 hover:text-slate-200'}`}
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


function HistoricalModeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="6" />
      {/* clock hands pointing to "birth time" */}
      <line x1="9" y1="9" x2="9" y2="5.5" />
      <line x1="9" y1="9" x2="12" y2="10.5" strokeOpacity="0.6" />
      {/* small rewind arrow */}
      <path d="M4.5 5.5 A5.5 5.5 0 0 1 9 3.5" strokeOpacity="0.7" />
      <polyline points="4.5,3.5 4.5,5.5 6.5,5.5" strokeOpacity="0.7" />
    </svg>
  );
}

function ConstellationOverlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      {/* dots */}
      <circle cx="4"  cy="4"  r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="3"  r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9"  cy="9"  r="1.1" fill="currentColor" stroke="none" />
      <circle cx="3"  cy="14" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="1.1" fill="currentColor" stroke="none" />
      {/* lines */}
      <line x1="4"  y1="4"  x2="14" y2="3"  strokeOpacity="0.55" />
      <line x1="14" y1="3"  x2="9"  y2="9"  strokeOpacity="0.55" />
      <line x1="9"  y1="9"  x2="3"  y2="14" strokeOpacity="0.55" />
      <line x1="9"  y1="9"  x2="14" y2="14" strokeOpacity="0.55" />
      <line x1="4"  y1="4"  x2="3"  y2="14" strokeOpacity="0.30" />
    </svg>
  );
}

function SatelliteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="2.4" />
      <path d="M9 4.6V2 M9 13.4V16 M4.6 9H2 M13.4 9H16" />
      <path d="M5.5 5.5L4 4 M12.5 12.5L14 14 M5.5 12.5L4 14 M12.5 5.5L14 4" strokeOpacity="0.55" />
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

function NowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="9" cy="9" r="6" />
      <path d="M9 5.3v3.7l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

