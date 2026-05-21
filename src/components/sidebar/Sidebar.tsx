import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Axis3d,
  Globe2,
  Network,
  RefreshCcw,
  Satellite,
  Sparkles,
  Tag,
} from 'lucide-react';
import {
  CoordinatesForm,
  type CityResult,
  type SearchHistoryEntry,
} from '@/features/natal-input';
import { cn, IconButton, surfaceClasses } from '../ui';
import { TooltipWrap } from '../Tooltip';
import { type CelestialReading } from '@/features/astronomy';
import { useCockpitDisplay } from '../../context/useCockpitDisplay';
import { useT } from '../../context/useLocale';
import { SidebarHeader } from './SidebarHeader';
import { SystemDock } from './SystemDock';
import type { SidebarPanelKey } from './types';

const EXPANDED_PX = 280;
const COLLAPSED_PX = 56;
const UNLOCK_WINDOW_MS = 1200;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;

  activePanel: SidebarPanelKey | null;
  onTogglePanel: (key: SidebarPanelKey) => void;

  // Analysis modal (single entry point)
  analysisOpen: boolean;
  /** Bumps each time a new reading is computed — used to pulse the CTA. */
  analysisAttention: number;
  onOpenAnalysis: () => void;

  // Always-visible coordinates form (top of sidebar)
  date: string;
  time: string;
  city: CityResult;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCityChange: (v: CityResult) => void;
  onJump: (reading: CelestialReading) => void;

  // Recent searches surfaced under the form
  searchHistory: SearchHistoryEntry[];
  onRecordSearch: (entry: { date: string; time: string; city: CityResult }) => void;
  onRemoveSearch: (signature: string) => void;

  hasReading: boolean;

  // Camera fly-to actions — destinations rail above the layer grid.
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  // System
  fullscreenActive: boolean;
  onToggleFullscreen: () => void;

  // Exports
  onExportView: () => void;
  exportingView: boolean;
  onExportPdf: () => void;
  exportingPdf: boolean;
  canExportReport: boolean;
}

/**
 * Unified left sidebar. Hosts the coordinates form, the analysis CTA, a
 * flat grid of display layers, and a pinned system dock. In collapsed
 * mode (56 px), the chip grid degrades to a vertical icon column so
 * each layer stays one click away without forcing the user to expand.
 */
export function Sidebar(props: SidebarProps) {
  const t = useT();
  const {
    collapsed,
    onToggleCollapsed,
    activePanel,
    onTogglePanel,
    analysisOpen,
    analysisAttention,
    onOpenAnalysis,
    date,
    time,
    city,
    onDateChange,
    onTimeChange,
    onCityChange,
    onJump,
    searchHistory,
    onRecordSearch,
    onRemoveSearch,
    hasReading,
    onFlySun,
    onFlyMoon,
    onFlyEarth,
    fullscreenActive,
    onToggleFullscreen,
    onExportView,
    exportingView,
    onExportPdf,
    exportingPdf,
    canExportReport,
  } = props;

  const {
    bodyLabelsEnabled,
    toggleBodyLabels,
    guidesEnabled,
    toggleGuides,
    satellitesEnabled,
    toggleSatellites,
    constellationOverlayEnabled,
    toggleConstellationOverlay,
    orbitalAvailable,
    orbitalStatus,
    sideViewActive,
    toggleSideView,
    hasSelectedStar,
  } = useCockpitDisplay();

  // Pulse the Analyse CTA every time a new reading is computed — both for the
  // initial unlock and for subsequent recomputes (so the user notices fresh
  // data even though we no longer auto-open the modal). The trigger is
  // derived from a prop change *during render* (storing the last attention
  // bump in state) rather than from an effect — avoids the cascading-render
  // smell flagged by react-hooks/set-state-in-effect.
  const [unlocking, setUnlocking] = useState(false);
  const [lastAttention, setLastAttention] = useState(analysisAttention);
  if (analysisAttention !== lastAttention) {
    setLastAttention(analysisAttention);
    if (analysisAttention !== 0) setUnlocking(true);
  }
  useEffect(() => {
    if (!unlocking) return;
    const id = window.setTimeout(() => setUnlocking(false), UNLOCK_WINDOW_MS);
    return () => window.clearTimeout(id);
  }, [unlocking]);

  const orbitalAriaLabel = orbitalAvailable
    ? orbitalStatus === 'loading'
      ? t.sidebar.layers.orbitalAria.loading
      : orbitalStatus === 'error'
        ? t.sidebar.layers.orbitalAria.error
        : t.sidebar.layers.orbitalAria.live
    : t.sidebar.layers.orbitalAria.unavailable;

  const orbitalStatusDot: LayerDef['status'] =
    orbitalStatus === 'loading'
      ? 'loading'
      : orbitalStatus === 'error'
        ? 'error'
        : null;

  const layers: LayerDef[] = [
    {
      key: 'labels',
      label: t.sidebar.layers.labels,
      icon: <Tag className="size-3.5" strokeWidth={1.4} aria-hidden />,
      active: bodyLabelsEnabled,
      onClick: toggleBodyLabels,
    },
    {
      key: 'guides',
      label: t.sidebar.layers.guides,
      icon: <Globe2 className="size-3.5" strokeWidth={1.4} aria-hidden />,
      active: guidesEnabled,
      onClick: toggleGuides,
    },
    {
      key: 'orbital',
      label: t.sidebar.layers.orbital,
      icon: <Network className="size-3.5" strokeWidth={1.4} aria-hidden />,
      active: constellationOverlayEnabled,
      disabled: !orbitalAvailable,
      ariaLabel: orbitalAriaLabel,
      onClick: toggleConstellationOverlay,
      status: orbitalStatusDot,
    },
    {
      key: 'relics',
      label: t.sidebar.layers.relics,
      icon: <Satellite className="size-3.5" strokeWidth={1.4} aria-hidden />,
      active: satellitesEnabled,
      onClick: toggleSatellites,
    },
    {
      key: 'side-view',
      label: hasSelectedStar ? t.sidebar.layers.sideView : t.sidebar.layers.sideViewLocked,
      icon: <Axis3d className="size-3.5" strokeWidth={1.4} aria-hidden />,
      active: sideViewActive,
      disabled: !hasSelectedStar,
      onClick: toggleSideView,
      fullWidth: true,
    },
  ];

  return (
    <motion.aside
      aria-label={t.cockpit.sidebarLabel}
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_PX : EXPANDED_PX }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className={cn(
        'absolute top-0 bottom-0 left-0 z-30 flex flex-col overflow-hidden',
        surfaceClasses('console'),
        // Surface emits `border` on all sides; the sidebar only wants its
        // right edge visible against the canvas.
        'border-y-0 border-l-0',
      )}
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
          history={searchHistory}
          onRecordHistory={onRecordSearch}
          onRemoveHistory={onRemoveSearch}
        />
      )}

      <AnalysisCTA
        collapsed={collapsed}
        active={analysisOpen}
        locked={!hasReading}
        unlocking={unlocking}
        onClick={onOpenAnalysis}
      />

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain
                   [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {collapsed ? (
          <CollapsedCameraRail
            onFlySun={onFlySun}
            onFlyMoon={onFlyMoon}
            onFlyEarth={onFlyEarth}
          />
        ) : (
          <ExpandedCameraSection
            onFlySun={onFlySun}
            onFlyMoon={onFlyMoon}
            onFlyEarth={onFlyEarth}
          />
        )}
        {collapsed ? (
          <CollapsedLayerRail layers={layers} />
        ) : (
          <ExpandedLayerGrid layers={layers} />
        )}
        {!collapsed && orbitalStatus === 'error' && (
          <OrbitalErrorRibbon onRetry={toggleConstellationOverlay} />
        )}
      </div>

      <SystemDock
        collapsed={collapsed}
        legendActive={activePanel === 'legend'}
        onToggleLegend={() => onTogglePanel('legend')}
        fullscreenActive={fullscreenActive}
        onToggleFullscreen={onToggleFullscreen}
        onExportView={onExportView}
        exportingView={exportingView}
        onExportPdf={onExportPdf}
        exportingPdf={exportingPdf}
        canExportReport={canExportReport}
      />
    </motion.aside>
  );
}

/* ── CTA — single entry point that opens the analysis modal ─────────────── */

interface AnalysisCTAProps {
  collapsed: boolean;
  active: boolean;
  locked: boolean;
  unlocking: boolean;
  onClick: () => void;
}

function AnalysisCTA({
  collapsed,
  active,
  locked,
  unlocking,
  onClick,
}: AnalysisCTAProps) {
  const t = useT();
  const ariaLabel = locked
    ? t.analysisCta.lockedAriaLabel
    : t.analysisCta.openAriaLabel;

  // "Ready" = a reading exists and the modal is closed. That's the state we
  // want to advertise visually so the user notices fresh data without us
  // auto-opening the modal.
  const ready = !locked && !active;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-2">
        <TooltipWrap
          text={locked ? t.analysisCta.tooltipLocked : t.analysisCta.tooltipReady}
          placement="right"
        >
          <IconButton
            size="xl"
            onClick={onClick}
            disabled={locked}
            active={active}
            aria-label={ariaLabel}
            className={cn(
              locked && 'animate-rail-breathe',
              unlocking && !locked && 'animate-rail-unlock',
              ready &&
                !unlocking &&
                'animate-cta-glow border-violet-400/55 bg-violet-500/12 text-violet-50',
            )}
          >
            <Sparkles className="size-4.5" strokeWidth={1.4} aria-hidden />
          </IconButton>
        </TooltipWrap>
      </div>
    );
  }

  return (
    <div className="px-3 pt-2 pb-3">
      <button
        type="button"
        onClick={onClick}
        disabled={locked}
        aria-label={ariaLabel}
        aria-pressed={active}
        className={cn(
          'cockpit-focus group w-full min-w-0 overflow-hidden',
          'flex items-center gap-2.5 rounded-md border',
          'px-2.5 py-2 transition-colors',
          'text-cockpit-sm tracking-cockpit-caps font-medium',
          'disabled:cursor-not-allowed',
          active
            ? 'border-cyan-300/45 bg-cyan-400/8 text-white'
            : locked
              ? 'border-white/8 bg-white/2 text-slate-400 animate-rail-breathe'
              : 'border-violet-400/45 bg-violet-500/10 text-violet-50 hover:bg-violet-500/15 hover:border-violet-300/60',
          unlocking && !locked && 'animate-rail-unlock',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'grid place-items-center size-7 rounded transition-colors shrink-0',
            active
              ? 'bg-cyan-400/15 text-cyan-100'
              : locked
                ? 'bg-white/3 text-slate-500'
                : 'bg-violet-400/20 text-violet-100 group-hover:text-white',
            ready && !unlocking && 'animate-cta-glow',
          )}
        >
          <Sparkles className="size-4" strokeWidth={1.4} />
        </span>
        <span className="flex-1 min-w-0 truncate text-left">{t.analysisCta.label}</span>
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 text-cockpit-xs tracking-cockpit-label normal-case',
            active
              ? 'text-cyan-200'
              : locked
                ? 'text-slate-600'
                : 'text-violet-200',
          )}
        >
          {locked ? '✕' : '→'}
        </span>
      </button>
    </div>
  );
}

/* ── Layer grid (expanded) ─────────────────────────────────────────────── */

interface LayerDef {
  key: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onClick: () => void;
  /** Spans both columns of the grid — used for the gated side-view chip. */
  fullWidth?: boolean;
  /** Optional status dot ('loading' | 'error' | null) — used by the orbital layer. */
  status?: 'loading' | 'error' | null;
}

function ExpandedLayerGrid({ layers }: { layers: LayerDef[] }) {
  const t = useT();
  return (
    <section aria-label={t.sidebar.layersSectionAriaLabel} className="px-3 pt-2 pb-2">
      <div
        className="px-1 pb-2 text-cockpit-xs tracking-cockpit-label uppercase
                   text-slate-500"
      >
        {t.sidebar.layersSectionLabel}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {layers.map(({ key, ...chipProps }) => (
          <LayerChip key={key} {...chipProps} />
        ))}
      </div>
    </section>
  );
}

function LayerChip({
  label,
  icon,
  active,
  disabled = false,
  ariaLabel,
  onClick,
  fullWidth = false,
  status,
}: Omit<LayerDef, 'key'>) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={ariaLabel ?? label}
      className={cn(
        'cockpit-focus group min-w-0 overflow-hidden',
        'flex items-center gap-2 rounded-md border',
        'px-2 py-1.5 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        fullWidth && 'col-span-2',
        active
          ? 'border-cyan-300/40 bg-cyan-400/8 text-white'
          : 'border-white/8 bg-white/3 text-slate-200 hover:bg-white/6 hover:border-white/15 hover:text-white',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid place-items-center size-6 rounded transition-colors shrink-0',
          active
            ? 'bg-cyan-400/12 text-cyan-100'
            : 'bg-white/4 text-slate-400 group-hover:text-slate-200',
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-left',
          'text-cockpit-sm tracking-cockpit-tight font-medium',
        )}
      >
        {label}
      </span>
      {status && (
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 size-1.5 rounded-full',
            status === 'loading'
              ? 'bg-amber-300 animate-rail-breathe'
              : 'bg-rose-400',
          )}
        />
      )}
    </button>
  );
}

/* ── Camera dock — quick fly-to (Sun / Moon / Earth) ──────────────────── */

interface CameraDockProps {
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;
}

interface CameraDestination {
  key: 'sun' | 'moon' | 'earth';
  glyph: string;
  glyphClass: string;
  label: string;
  tooltip: string;
  ariaLabel: string;
}

function useCameraDestinations(): readonly CameraDestination[] {
  const t = useT();
  return [
    {
      key: 'sun',
      glyph: '☀',
      glyphClass: 'text-glyph-sun',
      label: t.sidebar.cameraDestinations.sun.label,
      tooltip: t.sidebar.cameraDestinations.sun.tooltip,
      ariaLabel: t.sidebar.cameraDestinations.sun.ariaLabel,
    },
    {
      key: 'moon',
      glyph: '☾',
      glyphClass: 'text-glyph-moon',
      label: t.sidebar.cameraDestinations.moon.label,
      tooltip: t.sidebar.cameraDestinations.moon.tooltip,
      ariaLabel: t.sidebar.cameraDestinations.moon.ariaLabel,
    },
    {
      key: 'earth',
      glyph: '⊕',
      glyphClass: 'text-glyph-earth',
      label: t.sidebar.cameraDestinations.earth.label,
      tooltip: t.sidebar.cameraDestinations.earth.tooltip,
      ariaLabel: t.sidebar.cameraDestinations.earth.ariaLabel,
    },
  ];
}

function ExpandedCameraSection({ onFlySun, onFlyMoon, onFlyEarth }: CameraDockProps) {
  const t = useT();
  const destinations = useCameraDestinations();
  const handlers = { sun: onFlySun, moon: onFlyMoon, earth: onFlyEarth };
  return (
    <section
      aria-label={t.sidebar.cameraSectionAriaLabel}
      className="px-3 pt-2 pb-2 border-b border-border-hud-faint"
    >
      <div
        className="px-1 pb-2 text-cockpit-xs tracking-cockpit-label uppercase
                   text-slate-500"
      >
        {t.sidebar.cameraSectionLabel}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {destinations.map(({ key, glyph, glyphClass, tooltip, ariaLabel }) => (
          <TooltipWrap key={key} text={tooltip} placement="bottom">
            <IconButton
              size="lg"
              onClick={handlers[key]}
              aria-label={ariaLabel}
              className="w-full"
            >
              <span
                aria-hidden="true"
                className={cn('text-cockpit-glyph leading-none', glyphClass)}
              >
                {glyph}
              </span>
            </IconButton>
          </TooltipWrap>
        ))}
      </div>
    </section>
  );
}

function CollapsedCameraRail({ onFlySun, onFlyMoon, onFlyEarth }: CameraDockProps) {
  const t = useT();
  const destinations = useCameraDestinations();
  const handlers = { sun: onFlySun, moon: onFlyMoon, earth: onFlyEarth };
  return (
    <ul
      role="list"
      aria-label={t.sidebar.cameraSectionAriaLabel}
      className="flex flex-col items-center gap-1 pt-2 pb-2 mb-1
                 border-b border-border-hud-faint"
    >
      {destinations.map(({ key, glyph, glyphClass, tooltip, ariaLabel }) => (
        <li key={key}>
          <TooltipWrap text={tooltip} placement="right">
            <IconButton
              size="lg"
              onClick={handlers[key]}
              aria-label={ariaLabel}
            >
              <span
                aria-hidden="true"
                className={cn('text-cockpit-glyph leading-none', glyphClass)}
              >
                {glyph}
              </span>
            </IconButton>
          </TooltipWrap>
        </li>
      ))}
    </ul>
  );
}

/* ── Orbital error ribbon — visible when Celestrak fetch fails ──────────── */

interface OrbitalErrorRibbonProps {
  onRetry: () => void;
}

function OrbitalErrorRibbon({ onRetry }: OrbitalErrorRibbonProps) {
  const t = useT();
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-3 mt-2 mb-1 px-2.5 py-2 flex items-start gap-2
                 rounded-md border border-rose-400/30 bg-rose-500/8
                 text-cockpit-xs tracking-cockpit-tight text-rose-100"
    >
      <AlertTriangle
        className="shrink-0 size-3.5 mt-px text-rose-300"
        strokeWidth={1.6}
        aria-hidden
      />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="leading-snug">{t.orbital.errorBody}</p>
        <button
          type="button"
          onClick={onRetry}
          aria-label={t.orbital.retryAriaLabel}
          className="cockpit-focus inline-flex items-center gap-1
                     px-1.5 py-0.5 rounded
                     text-cockpit-xs tracking-cockpit-label uppercase
                     text-rose-100 hover:text-white
                     border border-rose-400/40 hover:bg-rose-500/10
                     transition-colors"
        >
          <RefreshCcw className="size-3" strokeWidth={1.6} aria-hidden />
          {t.orbital.retryLabel}
        </button>
      </div>
    </div>
  );
}

/* ── Layer rail (collapsed) — icon-only column ──────────────────────────── */

function CollapsedLayerRail({ layers }: { layers: LayerDef[] }) {
  const t = useT();
  return (
    <ul
      role="list"
      aria-label={t.sidebar.layersSectionAriaLabel}
      className="flex flex-col items-center gap-1 pt-2"
    >
      {layers.map((layer) => (
        <li key={layer.key}>
          <TooltipWrap text={layer.ariaLabel ?? layer.label} placement="right">
            <IconButton
              size="lg"
              active={layer.active}
              disabled={layer.disabled}
              onClick={layer.disabled ? undefined : layer.onClick}
              aria-pressed={layer.active}
              aria-label={layer.ariaLabel ?? layer.label}
            >
              {layer.icon}
            </IconButton>
          </TooltipWrap>
        </li>
      ))}
    </ul>
  );
}

/* ── Exposed layout constants (used by Cockpit for canvas insets) ──────── */

export const SIDEBAR_EXPANDED_PX = EXPANDED_PX;
export const SIDEBAR_COLLAPSED_PX = COLLAPSED_PX;
