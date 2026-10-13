import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Globe2,
  Satellite,
  Tag,
} from 'lucide-react';
import {
  CoordinatesForm,
  type CityResult,
  type SearchHistoryEntry,
} from '@/features/natal-input';
import { cn, IconButton, surfaceClasses } from '@/ui';
import { TooltipWrap } from '../Tooltip';
import { type CelestialReading } from '@/features/astronomy';
import { useCockpitDisplay } from '@/context/useCockpitDisplay';
import { useT } from '@/context/useLocale';
import { SidebarHeader } from './SidebarHeader';
import { SignResult } from './SignResult';
import { CollapsedCameraRail, ExpandedCameraSection } from './SidebarCamera';
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
  /** Localized true sign once a reading exists — shown as the result card. */
  signLabel: string | null;

  // Camera fly-to actions — destinations rail above the layer grid.
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  // System
  fullscreenActive: boolean;
  onToggleFullscreen: () => void;

  // Share link
  onShareLink: () => void;
  shareCopied: boolean;
  canShareLink: boolean;

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
    signLabel,
    onFlySun,
    onFlyMoon,
    onFlyEarth,
    fullscreenActive,
    onToggleFullscreen,
    onShareLink,
    shareCopied,
    canShareLink,
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
  } = useCockpitDisplay();
  const [exploreOpen, setExploreOpen] = useState(false);

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
      key: 'relics',
      label: t.sidebar.layers.relics,
      icon: <Satellite className="size-3.5" strokeWidth={1.4} aria-hidden />,
      active: satellitesEnabled,
      onClick: toggleSatellites,
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

      {hasReading && signLabel && (
        <SignResult
          collapsed={collapsed}
          signLabel={signLabel}
          active={analysisOpen}
          unlocking={unlocking}
          onOpen={onOpenAnalysis}
          onShare={onShareLink}
          shareCopied={shareCopied}
          canShare={canShareLink}
        />
      )}

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain
                   [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {collapsed ? (
          <>
            <CollapsedCameraRail
              onFlySun={onFlySun}
              onFlyMoon={onFlyMoon}
              onFlyEarth={onFlyEarth}
            />
            <CollapsedLayerRail layers={layers} />
          </>
        ) : (
          <section className="px-3 pt-2 pb-2">
            {/* Disclosure header, not an action — plain button by design. */}
            <button
              type="button"
              onClick={() => setExploreOpen((v) => !v)}
              aria-expanded={exploreOpen}
              aria-controls="sidebar-explore"
              className="cockpit-focus w-full flex items-center justify-between
                         px-1 py-1.5 rounded text-cockpit-xs tracking-cockpit-label
                         uppercase text-slate-400 hover:text-slate-200 transition-colors"
            >
              {t.sidebar.exploreSectionLabel}
              <ChevronDown
                className={cn('size-3.5 transition-transform', exploreOpen && 'rotate-180')}
                strokeWidth={1.6}
                aria-hidden
              />
            </button>
            {exploreOpen && (
              <div id="sidebar-explore" className="-mx-3 pt-1">
                <ExpandedCameraSection
                  onFlySun={onFlySun}
                  onFlyMoon={onFlyMoon}
                  onFlyEarth={onFlyEarth}
                />
                <ExpandedLayerGrid layers={layers} />
              </div>
            )}
          </section>
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

/* ── Layer grid (expanded) ─────────────────────────────────────────────── */

interface LayerDef {
  key: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onClick: () => void;
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
    </button>
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
