import {
  Atom,
  Axis3d,
  BookOpen,
  ChevronRight,
  Globe2,
  Lock,
  Map,
  Network,
  Satellite,
  Sparkles,
  Tag,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { BodyInfoHud } from '../BodyInfoHud';
import type { ReportPanelKey } from '../RightPanel';
import type { SelectedBody } from '../space/SpaceView';
import type { OrbitalStatus } from '../../hooks/useOrbitalPopulation';
import { cn } from '../ui';
import type { MobileTabKey } from './MobileTabBar';

interface MobileSheetContentProps {
  activeTab: MobileTabKey | null;

  hasReading: boolean;
  onOpenCoords: () => void;
  onSelectAnalysisPanel: (panel: ReportPanelKey) => void;

  // Display toggles
  bodyLabelsEnabled: boolean;
  onToggleBodyLabels: () => void;
  guidesEnabled: boolean;
  onToggleGuides: () => void;
  satellitesEnabled: boolean;
  onToggleSatellites: () => void;
  constellationOverlayEnabled: boolean;
  onToggleConstellationOverlay: () => void;
  orbitalAvailable: boolean;
  orbitalStatus: OrbitalStatus;
  hasSelectedStar: boolean;
  sideViewActive: boolean;
  onToggleSideView: () => void;

  // Navigation
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  // Selection
  selectedBody: SelectedBody | null;
  onCloseSelection: () => void;
}

/**
 * Routes the mobile bottom sheet's content based on the active tab. When
 * no tab is active, falls back to a "home" surface showing the primary
 * CTA. Each tab is a flat list of toggles / actions / panel-openers
 * styled for thumb reach.
 */
export function MobileSheetContent(props: MobileSheetContentProps) {
  const { activeTab } = props;

  if (activeTab === 'selection') return <SelectionContent {...props} />;
  if (activeTab === 'display') return <DisplayContent {...props} />;
  if (activeTab === 'navigation') return <NavigationContent {...props} />;
  if (activeTab === 'analysis') return <AnalysisContent {...props} />;
  return <HomeContent {...props} />;
}

/* ── Home (no active tab) ────────────────────────────────────────────────── */

function HomeContent({
  hasReading,
  onOpenCoords,
}: MobileSheetContentProps) {
  return (
    <SheetSection>
      <SheetEyebrow>Console</SheetEyebrow>

      <button
        type="button"
        onClick={onOpenCoords}
        className="cockpit-focus w-full px-4 py-3 min-h-11 rounded-panel
                   border border-border-control bg-violet-600/15
                   text-white text-cockpit-sm tracking-cockpit
                   hover:bg-violet-600/25 hover:border-accent-label
                   transition-all inline-flex items-center justify-center gap-2"
      >
        <span aria-hidden className="text-violet-200/90 leading-none">✦</span>
        {hasReading ? 'MODIFIER MES COORDONNÉES' : 'CALCULER MON SIGNE'}
      </button>

      <p className="pt-2 text-cockpit-xs text-slate-400/85 leading-relaxed">
        Choisis une section dans la barre du bas — affichage, navigation,
        ou analyse une fois ton ciel calculé.
      </p>
    </SheetSection>
  );
}

/* ── Selection ───────────────────────────────────────────────────────────── */

function SelectionContent({
  selectedBody,
  sideViewActive,
  onToggleSideView,
  onCloseSelection,
}: MobileSheetContentProps) {
  if (!selectedBody) {
    return (
      <SheetSection>
        <SheetEyebrow>Sélection</SheetEyebrow>
        <p className="text-cockpit-sm text-slate-400/85 leading-relaxed">
          Tape un astre dans la vue 3D pour voir ses informations ici.
        </p>
      </SheetSection>
    );
  }
  return (
    <BodyInfoHud
      variant="inline"
      selected={selectedBody}
      sideViewActive={sideViewActive}
      onToggleSideView={onToggleSideView}
      onClose={onCloseSelection}
    />
  );
}

/* ── Display ─────────────────────────────────────────────────────────────── */

function DisplayContent({
  bodyLabelsEnabled,
  onToggleBodyLabels,
  guidesEnabled,
  onToggleGuides,
  satellitesEnabled,
  onToggleSatellites,
  constellationOverlayEnabled,
  onToggleConstellationOverlay,
  orbitalAvailable,
  orbitalStatus,
  hasSelectedStar,
  sideViewActive,
  onToggleSideView,
}: MobileSheetContentProps) {
  const orbitalSublabel = !orbitalAvailable
    ? 'Indisponible loin du jour J'
    : orbitalStatus === 'loading'
      ? 'Chargement Celestrak…'
      : orbitalStatus === 'error'
        ? 'Réessayer'
        : 'Temps réel · Celestrak';

  return (
    <SheetSection>
      <SheetEyebrow>Affichage</SheetEyebrow>

      <ToggleRow
        label="Noms et lignes"
        sublabel="Astres · constellations"
        icon={<Tag className="size-4" strokeWidth={1.35} aria-hidden />}
        active={bodyLabelsEnabled}
        onClick={onToggleBodyLabels}
      />
      <ToggleRow
        label="Repères du ciel"
        sublabel="Axe · équateur · écliptique"
        icon={<Globe2 className="size-4" strokeWidth={1.35} aria-hidden />}
        active={guidesEnabled}
        onClick={onToggleGuides}
      />
      <ToggleRow
        label="Population orbitale"
        sublabel={orbitalSublabel}
        icon={<Network className="size-4" strokeWidth={1.4} aria-hidden />}
        active={constellationOverlayEnabled}
        disabled={!orbitalAvailable}
        onClick={orbitalAvailable ? onToggleConstellationOverlay : undefined}
      />
      <ToggleRow
        label="Reliques orbitales"
        sublabel="Satellites historiques"
        icon={<Satellite className="size-4" strokeWidth={1.4} aria-hidden />}
        active={satellitesEnabled}
        onClick={onToggleSatellites}
      />

      <Divider />

      <ToggleRow
        label="Perspective axiale"
        sublabel={
          hasSelectedStar
            ? 'Vue de côté · constellation'
            : 'Sélectionne une étoile'
        }
        icon={<Axis3d className="size-4" strokeWidth={1.4} aria-hidden />}
        active={sideViewActive}
        disabled={!hasSelectedStar}
        onClick={hasSelectedStar ? onToggleSideView : undefined}
      />
    </SheetSection>
  );
}

/* ── Navigation ──────────────────────────────────────────────────────────── */

function NavigationContent({
  onFlySun,
  onFlyMoon,
  onFlyEarth,
}: MobileSheetContentProps) {
  return (
    <SheetSection>
      <SheetEyebrow>Navigation</SheetEyebrow>

      <ActionRow
        label="Soleil"
        sublabel="Centrer la caméra"
        icon={<span className="text-cockpit-glyph leading-none text-glyph-sun">☀</span>}
        onClick={onFlySun}
      />
      <ActionRow
        label="Lune"
        sublabel="Centrer la caméra"
        icon={<span className="text-cockpit-glyph leading-none text-glyph-moon">☾</span>}
        onClick={onFlyMoon}
      />
      <ActionRow
        label="Terre"
        sublabel="Vue orbitale par défaut"
        icon={<span className="text-cockpit-glyph leading-none text-glyph-earth">⊕</span>}
        onClick={onFlyEarth}
      />
    </SheetSection>
  );
}

/* ── Analysis ────────────────────────────────────────────────────────────── */

function AnalysisContent({
  hasReading,
  onSelectAnalysisPanel,
  onOpenCoords,
}: MobileSheetContentProps) {
  if (!hasReading) {
    return (
      <SheetSection>
        <SheetEyebrow>Analyse</SheetEyebrow>
        <p className="text-cockpit-sm text-slate-400/85 leading-relaxed">
          Calcule d’abord ton ciel de naissance pour débloquer les
          analyses.
        </p>
        <button
          type="button"
          onClick={onOpenCoords}
          className="cockpit-focus w-full px-4 py-3 min-h-11 rounded-panel
                     border border-border-control bg-violet-600/15
                     text-white text-cockpit-sm tracking-cockpit
                     hover:bg-violet-600/25 hover:border-accent-label
                     transition-all inline-flex items-center justify-center gap-2"
        >
          <span aria-hidden className="text-violet-200/90 leading-none">✦</span>
          CALCULER MON SIGNE
        </button>
      </SheetSection>
    );
  }
  return (
    <SheetSection>
      <SheetEyebrow>Analyse</SheetEyebrow>

      <NavRow
        label="Mon signe"
        sublabel="Ton ciel de naissance"
        icon={<Sparkles className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('resume')}
      />
      <NavRow
        label="Carte"
        sublabel="Roue des constellations"
        icon={<Map className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('carte')}
      />
      <NavRow
        label="Lecture"
        sublabel="Comprendre ta carte"
        icon={<BookOpen className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('lecture')}
      />

      <Divider />

      <NavRow
        label="Données"
        sublabel="Astronomie brute"
        icon={<Atom className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('donnees')}
      />
    </SheetSection>
  );
}

/* ── Building blocks ─────────────────────────────────────────────────────── */

function SheetSection({ children }: { children: ReactNode }) {
  return <div className="px-3 pt-1 pb-4 space-y-1">{children}</div>;
}

function SheetEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="px-1 pb-2 text-cockpit-xs uppercase tracking-cockpit-label text-violet-300/70">
      {children}
    </div>
  );
}

function Divider() {
  return <div aria-hidden="true" className="my-2 mx-1 h-px bg-border-hud-faint" />;
}

interface RowProps {
  label: string;
  sublabel?: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToggleRow({ label, sublabel, icon, onClick, active = false, disabled = false }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled || !onClick}
      className={cn(
        'cockpit-focus relative w-full',
        'flex items-center gap-3 min-h-12 py-2 pl-2 pr-3 rounded',
        'transition-colors duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'text-cyan-100 bg-cyan-400/10'
          : 'text-slate-200/90 hover:text-slate-50 hover:bg-violet-500/10',
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
        <span className="block truncate text-cockpit-md tracking-tight">{label}</span>
        {sublabel && (
          <span className="block truncate text-cockpit-xs tracking-cockpit-tight uppercase text-slate-500">
            {sublabel}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'shrink-0 relative inline-block w-9 h-4 rounded-full transition-colors',
          active ? 'bg-cyan-400/60' : 'bg-slate-600/45',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-white shadow transition-[left]',
            active ? 'left-[calc(100%-0.75rem-1px)]' : 'left-px',
          )}
        />
      </span>
      {disabled && !active && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1
                     grid place-items-center size-4 rounded-full
                     bg-violet-950/85 border border-violet-400/40"
        >
          <Lock className="size-[8px] text-violet-200/85" strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
}

function ActionRow({ label, sublabel, icon, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cockpit-focus w-full
                 flex items-center gap-3 min-h-12 py-2 pl-2 pr-3 rounded
                 text-slate-200/90 hover:text-slate-50 hover:bg-violet-500/10
                 transition-colors"
    >
      <span aria-hidden="true" className="shrink-0 grid place-items-center w-5">
        {icon}
      </span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block truncate text-cockpit-md tracking-tight">{label}</span>
        {sublabel && (
          <span className="block truncate text-cockpit-xs tracking-cockpit-tight uppercase text-slate-500">
            {sublabel}
          </span>
        )}
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-slate-500" strokeWidth={1.5} aria-hidden />
    </button>
  );
}

function NavRow(props: RowProps) {
  return <ActionRow {...props} />;
}
