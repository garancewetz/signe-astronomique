import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Atom,
  Axis3d,
  BookOpen,
  Compass,
  Eye,
  Globe2,
  LayoutDashboard,
  Map,
  Network,
  Satellite,
  Sparkles,
  Tag,
  Telescope,
} from 'lucide-react';
import { type CityResult } from '../CityAutocomplete';
import { cn, surfaceClasses } from '../ui';
import { CoordinatesForm } from '../CoordinatesForm';
import { type CelestialReading } from '../../utils/astroEngine';
import type { OrbitalStatus } from '../../hooks/useOrbitalPopulation';
import { AnalysisItem, SidebarItem } from './SidebarItem';
import { SidebarHeader } from './SidebarHeader';
import {
  SectionBadge,
  SidebarDivider,
  SidebarSection,
} from './SidebarSection';
import { SystemDock } from './SystemDock';
import type { SectionKey, SidebarPanelKey } from './types';

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

  // Count of active display layers — surfaced as a chip on the AFFICHAGE
  // section title so the user knows what's on without opening the section.
  const displayActiveCount =
    (bodyLabelsEnabled ? 1 : 0) +
    (guidesEnabled ? 1 : 0) +
    (constellationOverlayEnabled ? 1 : 0) +
    (satellitesEnabled ? 1 : 0) +
    (sideViewActive ? 1 : 0);

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
          badge={
            displayActiveCount > 0 ? (
              <SectionBadge count={displayActiveCount} />
            ) : null
          }
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
        legendActive={activePanel === 'legend'}
        onToggleLegend={() => onTogglePanel('legend')}
        audioEnabled={audioEnabled}
        onToggleAudio={onToggleAudio}
        fullscreenActive={fullscreenActive}
        onToggleFullscreen={onToggleFullscreen}
        onExportView={onExportView}
        exportingView={exportingView}
        onExportReport={onExportReport}
        exportingReport={exportingReport}
        canExportReport={canExportReport}
      />
    </motion.aside>
  );
}

/* ── Exposed layout constants (used by Cockpit for canvas insets) ──────── */

export const SIDEBAR_EXPANDED_PX = EXPANDED_PX;
export const SIDEBAR_COLLAPSED_PX = COLLAPSED_PX;
