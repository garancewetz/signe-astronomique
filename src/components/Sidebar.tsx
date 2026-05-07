import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  Atom,
  Axis3d,
  BookOpen,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Compass,
  Download,
  Eye,
  FileText,
  Globe2,
  LayoutDashboard,
  List,
  Loader2,
  Lock,
  Map,
  Maximize2,
  Minimize2,
  Network,
  Ruler,
  Satellite,
  Sparkles,
  Tag,
  Telescope,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TooltipWrap } from './Tooltip';
import { ExploreSpacePopover, InfoCircleIcon } from './ExploreSpacePopover';
import { CityAutocomplete, type CityResult } from './CityAutocomplete';
import { Field, Input, cn } from './ui';
import { computeReading, type CelestialReading } from '../utils/astroEngine';
import { localBirthToUtc } from '../utils/timezone';
import type { OrbitalStatus } from '../hooks/useOrbitalPopulation';
import type { ReportPanelKey } from './RightPanel';

export type SectionKey =
  | 'selection'
  | 'display'
  | 'navigation'
  | 'analysis';
export type SidebarPanelKey = ReportPanelKey | 'body' | 'legend';

const EXPANDED_PX = 280;
const COLLAPSED_PX = 56;
const UNLOCK_WINDOW_MS = 1200;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;

  expandedSection: SectionKey | null;
  onExpandSection: (key: SectionKey | null) => void;

  activePanel: SidebarPanelKey | null;
  onTogglePanel: (key: SidebarPanelKey) => void;

  // Always-visible coordinates form (top of sidebar)
  date: string;
  time: string;
  city: CityResult;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCityChange: (v: CityResult) => void;
  onJump: (reading: CelestialReading) => void;
  onBlip: () => void;

  hasReading: boolean;
  hasSelectedBody: boolean;
  selectedBodyLabel: string | null;

  // Camera fly-to
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  // Sphere annotations
  guidesEnabled: boolean;
  onToggleGuides: () => void;
  bodyLabelsEnabled: boolean;
  onToggleBodyLabels: () => void;

  // Live data layers
  satellitesEnabled: boolean;
  onToggleSatellites: () => void;
  constellationOverlayEnabled: boolean;
  onToggleConstellationOverlay: () => void;
  orbitalAvailable: boolean;
  orbitalStatus: OrbitalStatus;

  // Star-only display modes (gated by selectedStar — disabled otherwise)
  hasSelectedStar: boolean;
  depthViewActive: boolean;
  onToggleDepthView: () => void;
  sideViewActive: boolean;
  onToggleSideView: () => void;

  // System
  audioEnabled: boolean;
  onToggleAudio: () => void;
  fullscreenActive: boolean;
  onToggleFullscreen: () => void;

  // Exports
  onExportView: () => void;
  exportingView: boolean;
  onExportReport: () => void;
  exportingReport: boolean;
  canExportReport: boolean;
}

/**
 * Unified left sidebar. Replaces the former two 50px rails, the top-right
 * chrome cluster, the bottom-right export cluster and the legend popover
 * with a single dashboard column. Sections are a single-open accordion;
 * the system row stays pinned at the bottom; the body slot only renders
 * when something is selected in the 3D scene.
 *
 * Width modes — `collapsed=false` shows section labels and inline items
 * (280 px); `collapsed=true` shrinks the rail to a 56 px icon column where
 * each section icon expands the sidebar back to its full width.
 */
export function Sidebar(props: SidebarProps) {
  const {
    collapsed,
    onToggleCollapsed,
    expandedSection,
    onExpandSection,
    activePanel,
    onTogglePanel,
    date,
    time,
    city,
    onDateChange,
    onTimeChange,
    onCityChange,
    onJump,
    onBlip,
    hasReading,
    hasSelectedBody,
    selectedBodyLabel,
    onFlySun,
    onFlyMoon,
    onFlyEarth,
    guidesEnabled,
    onToggleGuides,
    bodyLabelsEnabled,
    onToggleBodyLabels,
    satellitesEnabled,
    onToggleSatellites,
    constellationOverlayEnabled,
    onToggleConstellationOverlay,
    orbitalAvailable,
    orbitalStatus,
    hasSelectedStar,
    depthViewActive,
    onToggleDepthView,
    sideViewActive,
    onToggleSideView,
    audioEnabled,
    onToggleAudio,
    fullscreenActive,
    onToggleFullscreen,
    onExportView,
    exportingView,
    onExportReport,
    exportingReport,
    canExportReport,
  } = props;

  // Lock → unlock cascade for ANALYSE items, mirroring the original rail.
  const [unlocking, setUnlocking] = useState(false);
  const prevLockedRef = useRef(!hasReading);
  useEffect(() => {
    const wasLocked = prevLockedRef.current;
    const isLocked = !hasReading;
    if (wasLocked && !isLocked) {
      setUnlocking(true);
      const id = window.setTimeout(() => setUnlocking(false), UNLOCK_WINDOW_MS);
      prevLockedRef.current = isLocked;
      return () => window.clearTimeout(id);
    }
    prevLockedRef.current = isLocked;
  }, [hasReading]);

  const handleSectionClick = (key: SectionKey) => {
    if (collapsed) {
      onToggleCollapsed();
      onExpandSection(key);
      return;
    }
    onExpandSection(expandedSection === key ? null : key);
  };

  const orbitalLabel = orbitalAvailable
    ? orbitalStatus === 'loading'
      ? 'Population orbitale en chargement…'
      : orbitalStatus === 'error'
        ? 'Population orbitale — réessayer'
        : 'Population orbitale (temps réel)'
    : 'Population orbitale — indisponible loin de la date du jour';

  return (
    <motion.aside
      aria-label="Console de pilotage"
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_PX : EXPANDED_PX }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="absolute top-0 bottom-0 left-0 z-30
                 flex flex-col
                 bg-surface-console/55 backdrop-blur-xl
                 border-r border-border-hud-subtle
                 shadow-cockpit-panel
                 overflow-hidden"
    >
      <SidebarHeader collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />

      {!collapsed && (
        <CoordinatesForm
          date={date}
          time={time}
          city={city}
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
          onCityChange={onCityChange}
          onJump={onJump}
          onBlip={onBlip}
        />
      )}

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain
                   [&::-webkit-scrollbar]:hidden [scrollbar-width:none]
                   py-2"
      >
        {hasSelectedBody && (
          <SidebarSection
            sectionKey="selection"
            title="SÉLECTION"
            icon={<Telescope className="size-4.5" strokeWidth={1.4} aria-hidden />}
            collapsed={collapsed}
            expanded={expandedSection === 'selection'}
            onHeaderClick={() => handleSectionClick('selection')}
          >
            <SidebarItem
              kind="panel"
              label={selectedBodyLabel ?? 'Détails de l’objet'}
              icon={<Telescope className="size-4" strokeWidth={1.4} aria-hidden />}
              active={activePanel === 'body'}
              collapsed={collapsed}
              onClick={() => onTogglePanel('body')}
              ariaControls="panel-body"
            />
          </SidebarSection>
        )}

        <SidebarSection
          sectionKey="display"
          title="AFFICHAGE"
          icon={<Eye className="size-4.5" strokeWidth={1.4} aria-hidden />}
          collapsed={collapsed}
          expanded={expandedSection === 'display'}
          onHeaderClick={() => handleSectionClick('display')}
        >
          <SidebarItem
            kind="toggle"
            label="Noms et lignes"
            sublabel="Astres · constellations"
            icon={<Tag className="size-4" strokeWidth={1.35} aria-hidden />}
            active={bodyLabelsEnabled}
            collapsed={collapsed}
            onClick={onToggleBodyLabels}
          />
          <SidebarItem
            kind="toggle"
            label="Repères du ciel"
            sublabel="Axe · équateur · écliptique"
            icon={<Globe2 className="size-4" strokeWidth={1.35} aria-hidden />}
            active={guidesEnabled}
            collapsed={collapsed}
            onClick={onToggleGuides}
          />
          <SidebarItem
            kind="toggle"
            label="Population orbitale"
            sublabel={
              orbitalStatus === 'loading'
                ? 'Chargement Celestrak…'
                : orbitalStatus === 'error'
                  ? 'Réessayer'
                  : 'Temps réel · Celestrak'
            }
            icon={<Network className="size-4" strokeWidth={1.4} aria-hidden />}
            active={constellationOverlayEnabled}
            disabled={!orbitalAvailable}
            ariaLabel={orbitalLabel}
            collapsed={collapsed}
            onClick={
              orbitalAvailable ? onToggleConstellationOverlay : () => {}
            }
          />
          <SidebarItem
            kind="toggle"
            label="Reliques orbitales"
            sublabel="Satellites historiques"
            icon={<Satellite className="size-4" strokeWidth={1.4} aria-hidden />}
            active={satellitesEnabled}
            collapsed={collapsed}
            onClick={onToggleSatellites}
          />
          <SidebarDivider collapsed={collapsed} />
          <SidebarItem
            kind="toggle"
            label="Profondeur"
            sublabel={
              hasSelectedStar
                ? 'Vecteurs Terre → étoile'
                : 'Sélectionne une étoile'
            }
            icon={<Ruler className="size-4" strokeWidth={1.4} aria-hidden />}
            active={depthViewActive}
            disabled={!hasSelectedStar}
            collapsed={collapsed}
            onClick={hasSelectedStar ? onToggleDepthView : () => {}}
          />
          <SidebarItem
            kind="toggle"
            label="Perspective axiale"
            sublabel={
              hasSelectedStar
                ? 'Vue de côté · constellation'
                : 'Sélectionne une étoile'
            }
            icon={<Axis3d className="size-4" strokeWidth={1.4} aria-hidden />}
            active={sideViewActive}
            disabled={!hasSelectedStar}
            collapsed={collapsed}
            onClick={hasSelectedStar ? onToggleSideView : () => {}}
          />
        </SidebarSection>

        <SidebarSection
          sectionKey="navigation"
          title="NAVIGATION"
          icon={<Compass className="size-4.5" strokeWidth={1.4} aria-hidden />}
          collapsed={collapsed}
          expanded={expandedSection === 'navigation'}
          onHeaderClick={() => handleSectionClick('navigation')}
        >
          <SidebarItem
            kind="action"
            label="Soleil"
            sublabel="Centrer la caméra"
            icon={<span className="text-cockpit-glyph leading-none text-glyph-sun">☀</span>}
            collapsed={collapsed}
            onClick={onFlySun}
          />
          <SidebarItem
            kind="action"
            label="Lune"
            sublabel="Centrer la caméra"
            icon={<span className="text-cockpit-glyph leading-none text-glyph-moon">☾</span>}
            collapsed={collapsed}
            onClick={onFlyMoon}
          />
          <SidebarItem
            kind="action"
            label="Terre"
            sublabel="Vue orbitale par défaut"
            icon={<span className="text-cockpit-glyph leading-none text-glyph-earth">⊕</span>}
            collapsed={collapsed}
            onClick={onFlyEarth}
          />
        </SidebarSection>

        <SidebarSection
          sectionKey="analysis"
          title="ANALYSE"
          icon={<LayoutDashboard className="size-4.5" strokeWidth={1.4} aria-hidden />}
          collapsed={collapsed}
          expanded={expandedSection === 'analysis'}
          onHeaderClick={() => handleSectionClick('analysis')}
        >
          <AnalysisItem
            panelKey="resume"
            label="Mon signe"
            sublabel="Ton ciel de naissance"
            icon={<Sparkles className="size-4" strokeWidth={1.4} aria-hidden />}
            unlockIndex={0}
            {...{ activePanel, onTogglePanel, hasReading, unlocking, collapsed }}
          />
          <AnalysisItem
            panelKey="carte"
            label="Carte"
            sublabel="Roue des constellations"
            icon={<Map className="size-4" strokeWidth={1.4} aria-hidden />}
            unlockIndex={1}
            {...{ activePanel, onTogglePanel, hasReading, unlocking, collapsed }}
          />
          <AnalysisItem
            panelKey="lecture"
            label="Lecture"
            sublabel="Comprendre ta carte"
            icon={<BookOpen className="size-4" strokeWidth={1.4} aria-hidden />}
            unlockIndex={2}
            {...{ activePanel, onTogglePanel, hasReading, unlocking, collapsed }}
          />
          <SidebarDivider collapsed={collapsed} />
          <AnalysisItem
            panelKey="donnees"
            label="Données"
            sublabel="Astronomie brute"
            icon={<Atom className="size-4" strokeWidth={1.4} aria-hidden />}
            unlockIndex={3}
            {...{ activePanel, onTogglePanel, hasReading, unlocking, collapsed }}
          />
        </SidebarSection>
      </div>

      <SystemDock
        collapsed={collapsed}
        audioEnabled={audioEnabled}
        onToggleAudio={onToggleAudio}
        fullscreenActive={fullscreenActive}
        onToggleFullscreen={onToggleFullscreen}
        legendActive={activePanel === 'legend'}
        onToggleLegend={() => onTogglePanel('legend')}
        onExportView={onExportView}
        exportingView={exportingView}
        onExportReport={onExportReport}
        exportingReport={exportingReport}
        canExportReport={canExportReport}
      />
    </motion.aside>
  );
}

/* ── Header (brand + collapse toggle) ───────────────────────────────────── */

function SidebarHeader({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  return (
    <header
      className="shrink-0 flex items-center justify-between
                 h-11 px-3
                 border-b border-border-hud-faint"
    >
      {!collapsed && (
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 rounded-full bg-cyan-300
                       shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]"
          />
          <span
            className="truncate text-cockpit-sm tracking-cockpit-hud
                       text-accent-title uppercase"
          >
            CIEL&nbsp;RÉEL
          </span>
        </div>
      )}
      <TooltipWrap
        text={collapsed ? 'Étendre la console' : 'Réduire la console'}
        placement="right"
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Étendre la console' : 'Réduire la console'}
          aria-pressed={!collapsed}
          className="cockpit-focus grid place-items-center
                     h-8 w-8 rounded
                     text-slate-300/85 hover:text-slate-100
                     hover:bg-violet-500/10 transition-colors"
        >
          {collapsed ? (
            <ChevronsRight className="size-4" strokeWidth={1.4} aria-hidden />
          ) : (
            <ChevronsLeft className="size-4" strokeWidth={1.4} aria-hidden />
          )}
        </button>
      </TooltipWrap>
    </header>
  );
}

/* ── Section (accordion) ────────────────────────────────────────────────── */

interface SectionProps {
  sectionKey: SectionKey;
  title: string;
  icon: ReactNode;
  collapsed: boolean;
  expanded: boolean;
  onHeaderClick: () => void;
  children: ReactNode;
}

function SidebarSection({
  title,
  icon,
  collapsed,
  expanded,
  onHeaderClick,
  children,
}: SectionProps) {
  const reduceMotion = useReducedMotion();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-1">
        <TooltipWrap text={title} placement="right">
          <button
            type="button"
            onClick={onHeaderClick}
            aria-label={`Étendre — ${title}`}
            className={cn(
              'cockpit-focus grid place-items-center',
              'h-10 w-10 rounded',
              'text-slate-300/85 hover:text-slate-100',
              'hover:bg-violet-500/10 transition-colors',
            )}
          >
            <span aria-hidden="true">{icon}</span>
          </button>
        </TooltipWrap>
      </div>
    );
  }

  return (
    <section className="px-2 py-1">
      <button
        type="button"
        onClick={onHeaderClick}
        aria-expanded={expanded}
        className={cn(
          'cockpit-focus group w-full',
          'flex items-center gap-2.5 h-9 px-2 rounded',
          'text-cockpit-sm tracking-cockpit-label uppercase',
          'transition-colors',
          expanded
            ? 'text-accent-title bg-violet-500/8'
            : 'text-accent-label/85 hover:text-accent-title hover:bg-violet-500/6',
        )}
      >
        <span aria-hidden="true" className="shrink-0 text-accent-label/85">
          {icon}
        </span>
        <span className="flex-1 text-left truncate">{title}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 text-slate-500 transition-transform duration-200',
            expanded ? 'rotate-0' : '-rotate-90',
          )}
          strokeWidth={1.6}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <ul role="list" className="pt-1 pb-1.5 pl-2 pr-1 space-y-0.5">
              {children}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SidebarDivider({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <li aria-hidden="true" className="my-1 mx-1 h-px bg-border-hud-faint" />
  );
}

/* ── Item ───────────────────────────────────────────────────────────────── */

type ItemKind = 'action' | 'toggle' | 'panel';

interface ItemProps {
  kind: ItemKind;
  label: string;
  sublabel?: string;
  ariaLabel?: string;
  icon: ReactNode;
  active?: boolean;
  locked?: boolean;
  unlocking?: boolean;
  unlockIndex?: number;
  disabled?: boolean;
  collapsed: boolean;
  onClick: () => void;
  ariaControls?: string;
}

function SidebarItem({
  kind,
  label,
  sublabel,
  ariaLabel,
  icon,
  active = false,
  locked = false,
  unlocking = false,
  unlockIndex = 0,
  disabled = false,
  collapsed,
  onClick,
  ariaControls,
}: ItemProps) {
  // Collapsed mode hides the whole row; section icons are the only entry
  // points to inline items, so we render nothing here.
  if (collapsed) return null;

  const tooltip =
    locked && !active ? `${label} — verrouillé · ouvre COORDONNÉES` : label;

  const unlockStyle: CSSProperties | undefined = unlocking
    ? ({ '--rail-index': unlockIndex } as CSSProperties)
    : undefined;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? tooltip}
        aria-pressed={kind !== 'action' ? active : undefined}
        aria-controls={ariaControls}
        aria-expanded={kind === 'panel' ? active : undefined}
        disabled={disabled}
        data-locked={locked || undefined}
        data-unlocking={unlocking || undefined}
        style={unlockStyle}
        className={cn(
          'cockpit-focus relative w-full',
          'flex items-center gap-3 min-h-9 py-1.5 pl-2 pr-2.5 rounded',
          'transition-colors duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          active
            ? 'text-cyan-100 bg-cyan-400/10'
            : 'text-slate-200/90 hover:text-slate-50 hover:bg-violet-500/10',
          locked && !active && 'animate-rail-breathe',
          unlocking && !locked && 'animate-rail-unlock',
        )}
      >
          <span
            aria-hidden="true"
            className={cn(
              'shrink-0 grid place-items-center w-5',
              active ? 'text-cyan-200' : 'text-slate-300/85',
            )}
          >
            {icon}
          </span>
          <span className="flex-1 min-w-0 text-left">
            <span
              className={cn(
                'block truncate text-cockpit-lg tracking-tight',
                active ? 'text-cyan-50' : 'text-slate-100',
              )}
            >
              {label}
            </span>
            {sublabel && (
              <span className="block truncate text-cockpit-xs tracking-cockpit-tight uppercase text-slate-500">
                {sublabel}
              </span>
            )}
          </span>

          {/* Toggle pill — emerald when on, hairline when off. */}
          {kind === 'toggle' && (
            <span
              aria-hidden="true"
              className={cn(
                'shrink-0 relative inline-block w-7 h-3 rounded-full transition-colors',
                active ? 'bg-cyan-400/60' : 'bg-slate-600/45',
              )}
            >
              <span
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-white shadow transition-[left]',
                  active ? 'left-[calc(100%-0.625rem-1px)]' : 'left-px',
                )}
              />
            </span>
          )}

          {/* Padlock corner — locked panel item. */}
          {locked && !active && (
            <span
              aria-hidden="true"
              className="shrink-0 grid place-items-center
                         size-4 rounded-full
                         bg-violet-950/85 border border-violet-400/40"
            >
              <Lock className="size-[8px] text-violet-200/85" strokeWidth={2.5} />
            </span>
          )}

          {/* Active beam — cyan line on the right edge of the item. */}
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-y-1 -right-2 w-px bg-cyan-300',
              'transition-opacity duration-200',
              'shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]',
              active ? 'opacity-100' : 'opacity-0',
            )}
          />
      </button>
    </li>
  );
}

/* ── ANALYSE wrapper — shared lock/unlock state for the report stubs ────── */

function AnalysisItem({
  panelKey,
  label,
  sublabel,
  icon,
  unlockIndex,
  activePanel,
  onTogglePanel,
  hasReading,
  unlocking,
  collapsed,
}: {
  panelKey: ReportPanelKey;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  unlockIndex: number;
  activePanel: SidebarPanelKey | null;
  onTogglePanel: (key: SidebarPanelKey) => void;
  hasReading: boolean;
  unlocking: boolean;
  collapsed: boolean;
}) {
  return (
    <SidebarItem
      kind="panel"
      label={label}
      sublabel={sublabel}
      icon={icon}
      active={activePanel === panelKey}
      locked={!hasReading}
      unlocking={unlocking}
      unlockIndex={unlockIndex}
      collapsed={collapsed}
      onClick={() => onTogglePanel(panelKey)}
      ariaControls={`panel-${panelKey}`}
    />
  );
}

/* ── System dock (audio, fullscreen, info, legend, exports) ─────────────── */

interface SystemDockProps {
  collapsed: boolean;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  fullscreenActive: boolean;
  onToggleFullscreen: () => void;
  legendActive: boolean;
  onToggleLegend: () => void;
  onExportView: () => void;
  exportingView: boolean;
  onExportReport: () => void;
  exportingReport: boolean;
  canExportReport: boolean;
}

function SystemDock({
  collapsed,
  audioEnabled,
  onToggleAudio,
  fullscreenActive,
  onToggleFullscreen,
  legendActive,
  onToggleLegend,
  onExportView,
  exportingView,
  onExportReport,
  exportingReport,
  canExportReport,
}: SystemDockProps) {
  const [exploreOpen, setExploreOpen] = useState(false);

  return (
    <>
      <footer
        role="group"
        aria-label="Système"
        className={cn(
          'shrink-0 border-t border-border-hud-faint',
          'pb-[env(safe-area-inset-bottom,0)]',
          collapsed
            ? 'flex flex-col items-center gap-1 py-2'
            : 'grid grid-cols-3 gap-1 px-2 py-2',
        )}
      >
        <SystemButton
          tooltip="Ressources externes : cartes du ciel, éphémérides…"
          ariaLabel="Ouvrir la liste de liens utiles"
          active={exploreOpen}
          activeTone="sky"
          onClick={() => setExploreOpen((v) => !v)}
        >
          <InfoCircleIcon />
        </SystemButton>
        <SystemButton
          tooltip="Légende — symboles, couleurs, calques"
          ariaLabel="Ouvrir la légende"
          active={legendActive}
          activeTone="cyan"
          onClick={onToggleLegend}
        >
          <List className="size-4" strokeWidth={1.4} aria-hidden />
        </SystemButton>
        <SystemButton
          tooltip={fullscreenActive ? 'Quitter le plein écran' : 'Passer en plein écran'}
          ariaLabel={fullscreenActive ? 'Quitter le plein écran' : 'Passer en plein écran'}
          active={fullscreenActive}
          activeTone="sky"
          onClick={onToggleFullscreen}
        >
          {fullscreenActive ? (
            <Minimize2 className="size-4" strokeWidth={1.35} aria-hidden />
          ) : (
            <Maximize2 className="size-4" strokeWidth={1.35} aria-hidden />
          )}
        </SystemButton>
        <SystemButton
          tooltip={audioEnabled ? 'Couper le son' : 'Activer le son'}
          ariaLabel={audioEnabled ? 'Couper le son' : 'Activer le son'}
          active={audioEnabled}
          activeTone="emerald"
          onClick={onToggleAudio}
        >
          {audioEnabled ? (
            <Volume2 className="size-4" strokeWidth={1.35} aria-hidden />
          ) : (
            <VolumeX className="size-4" strokeWidth={1.35} aria-hidden />
          )}
        </SystemButton>
        <SystemButton
          tooltip="Enregistre la vue 3D actuelle dans un fichier image PNG"
          ariaLabel="Exporter la vue 3D en image PNG"
          onClick={onExportView}
          disabled={exportingView}
        >
          {exportingView ? (
            <Spinner />
          ) : (
            <Download className="size-4" strokeWidth={1.4} aria-hidden />
          )}
        </SystemButton>
        <SystemButton
          tooltip={
            canExportReport
              ? exportingReport
                ? 'Capture en cours…'
                : 'Enregistre la vue 3D et le rapport complet en PNG'
              : 'Calcule d’abord un thème natal pour exporter le rapport'
          }
          ariaLabel="Exporter la vue 3D et le rapport complet en PNG"
          onClick={onExportReport}
          disabled={!canExportReport || exportingReport}
        >
          {exportingReport ? (
            <Spinner />
          ) : (
            <FileText className="size-4" strokeWidth={1.35} aria-hidden />
          )}
        </SystemButton>
      </footer>

      <AnimatePresence>
        {exploreOpen && (
          <ExploreSpacePopover onClose={() => setExploreOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

type SystemTone = 'sky' | 'emerald' | 'cyan';

interface SystemButtonProps {
  children: ReactNode;
  tooltip: string;
  ariaLabel: string;
  onClick: () => void;
  active?: boolean;
  activeTone?: SystemTone;
  disabled?: boolean;
}

function SystemButton({
  children,
  tooltip,
  ariaLabel,
  onClick,
  active,
  activeTone = 'cyan',
  disabled = false,
}: SystemButtonProps) {
  const activeClasses =
    activeTone === 'emerald'
      ? 'text-emerald-100 bg-emerald-400/14 border border-emerald-300/55'
      : activeTone === 'sky'
        ? 'text-sky-100 bg-sky-400/14 border border-sky-300/55'
        : 'text-cyan-100 bg-cyan-400/14 border border-cyan-300/55';
  const inactive =
    'text-slate-300/85 hover:text-slate-100 hover:bg-violet-500/10 border border-transparent';

  return (
    <TooltipWrap text={tooltip} placement="top">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        {...(active !== undefined && { 'aria-pressed': active })}
        disabled={disabled}
        className={cn(
          'cockpit-focus grid place-items-center',
          'h-9 w-full rounded',
          'transition-colors duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          active === true ? activeClasses : inactive,
        )}
      >
        {children}
      </button>
    </TooltipWrap>
  );
}

function Spinner() {
  return (
    <Loader2
      className="size-3.5 animate-spin motion-reduce:animate-none"
      strokeWidth={1.6}
      aria-hidden
    />
  );
}

/* ── Always-visible coordinates form (top of sidebar) ───────────────────── */

interface CoordinatesFormProps {
  date: string;
  time: string;
  city: CityResult;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCityChange: (v: CityResult) => void;
  onJump: (reading: CelestialReading) => void;
  onBlip: () => void;
}

function formatTodayDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatNowTime(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function CoordinatesForm({
  date, time, city,
  onDateChange, onTimeChange, onCityChange,
  onJump, onBlip,
}: CoordinatesFormProps) {
  const reduceMotion = useReducedMotion();
  const [computing, setComputing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computing) return;
    onBlip();
    setComputing(true);
    await new Promise((r) => setTimeout(r, 350));
    const reading = computeReading({
      date: localBirthToUtc(date, time, city.timezone),
      latitude: city.lat,
      longitude: city.lon,
      placeLabel: city.label,
    });
    onJump(reading);
    setComputing(false);
  };

  const handleJumpToNow = () => {
    const now = new Date();
    onDateChange(formatTodayDate(now));
    onTimeChange(formatNowTime(now));
    onBlip();
    // "Aujourd'hui" bypasses the wall-clock-in-tz translation: we want the
    // actual current instant, so we feed `now` straight into computeReading.
    onJump(computeReading({
      date: now,
      latitude: city.lat,
      longitude: city.lon,
      placeLabel: city.label,
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 px-3 py-2.5 space-y-2
                 border-b border-border-hud-faint"
      aria-label="Coordonnées de naissance"
    >
      <div className="flex justify-end pb-0.5">
        <button
          type="button"
          onClick={handleJumpToNow}
          aria-label="Aujourd’hui — calcule le ciel actuel"
          className="cockpit-focus group inline-flex items-center gap-1
                     px-1.5 py-1 rounded
                     text-cockpit-xs tracking-cockpit-label uppercase
                     text-violet-300/75 hover:text-violet-100
                     hover:bg-violet-500/8
                     transition-colors"
        >
          <Clock
            className="size-3 transition-transform group-hover:rotate-12"
            strokeWidth={1.5}
            aria-hidden
          />
          Aujourd’hui
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <Field label="DATE">
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required
          />
        </Field>

        <Field label="HEURE">
          <Input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="LIEU DE NAISSANCE">
        <CityAutocomplete value={city} onSelect={onCityChange} />
      </Field>

      <div className="cockpit-input w-full text-cockpit-md flex items-center justify-between gap-1">
        <span>φ {city.lat.toFixed(2)}°</span>
        <span className="text-slate-600">·</span>
        <span>λ {city.lon.toFixed(2)}°</span>
      </div>

      <motion.button
        type="submit"
        disabled={computing}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className="cockpit-focus relative w-full mt-1 px-4 py-2 min-h-9 rounded-panel overflow-hidden
                   border border-border-control bg-violet-600/15
                   text-white text-cockpit-sm tracking-cockpit
                   hover:bg-violet-600/25 hover:border-accent-label
                   disabled:opacity-40 disabled:cursor-wait
                   transition-all inline-flex items-center justify-center gap-2"
      >
        <span aria-hidden className="relative z-10 text-violet-200/90 leading-none">✦</span>
        <span className="relative z-10">
          {computing ? 'Calcul du ciel…' : 'CALCULER MON SIGNE'}
        </span>
      </motion.button>
    </form>
  );
}

/* ── Exposed layout constants (used by Cockpit for canvas insets) ──────── */

export const SIDEBAR_EXPANDED_PX = EXPANDED_PX;
export const SIDEBAR_COLLAPSED_PX = COLLAPSED_PX;
