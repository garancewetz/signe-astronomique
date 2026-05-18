import {
  Atom,
  Axis3d,
  BookOpen,
  Globe2,
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
import { MenuRow } from '../ui';
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

      <MenuRow
        kind="toggle"
        size="lg"
        label="Noms et lignes"
        sublabel="Astres · constellations"
        icon={<Tag className="size-4" strokeWidth={1.35} aria-hidden />}
        active={bodyLabelsEnabled}
        onClick={onToggleBodyLabels}
      />
      <MenuRow
        kind="toggle"
        size="lg"
        label="Repères du ciel"
        sublabel="Axe · équateur · écliptique"
        icon={<Globe2 className="size-4" strokeWidth={1.35} aria-hidden />}
        active={guidesEnabled}
        onClick={onToggleGuides}
      />
      <MenuRow
        kind="toggle"
        size="lg"
        label="Population orbitale"
        sublabel={orbitalSublabel}
        icon={<Network className="size-4" strokeWidth={1.4} aria-hidden />}
        active={constellationOverlayEnabled}
        locked={!orbitalAvailable}
        disabled={!orbitalAvailable}
        onClick={orbitalAvailable ? onToggleConstellationOverlay : undefined}
      />
      <MenuRow
        kind="toggle"
        size="lg"
        label="Reliques orbitales"
        sublabel="Satellites historiques"
        icon={<Satellite className="size-4" strokeWidth={1.4} aria-hidden />}
        active={satellitesEnabled}
        onClick={onToggleSatellites}
      />

      <Divider />

      <MenuRow
        kind="toggle"
        size="lg"
        label="Perspective axiale"
        sublabel={
          hasSelectedStar
            ? 'Vue de côté · constellation'
            : 'Sélectionne une étoile'
        }
        icon={<Axis3d className="size-4" strokeWidth={1.4} aria-hidden />}
        active={sideViewActive}
        locked={!hasSelectedStar}
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

      <MenuRow
        size="lg"
        chevron
        label="Soleil"
        sublabel="Centrer la caméra"
        icon={<span className="text-cockpit-glyph leading-none text-glyph-sun">☀</span>}
        onClick={onFlySun}
      />
      <MenuRow
        size="lg"
        chevron
        label="Lune"
        sublabel="Centrer la caméra"
        icon={<span className="text-cockpit-glyph leading-none text-glyph-moon">☾</span>}
        onClick={onFlyMoon}
      />
      <MenuRow
        size="lg"
        chevron
        label="Terre"
        sublabel="Vue orbitale par défaut"
        icon={<span className="text-cockpit-glyph leading-none text-glyph-earth">⊕</span>}
        onClick={onFlyEarth}
      />
    </SheetSection>
  );
}

/* ── Analysis ────────────────────────────────────────────────────────────── */

// The "Analyse" tab is gated by `hasReading` inside MobileTabBar (the button
// is disabled until a reading exists), so this content always renders with a
// reading in hand — no empty-state branch needed.
function AnalysisContent({
  onSelectAnalysisPanel,
}: MobileSheetContentProps) {
  return (
    <SheetSection>
      <SheetEyebrow>Analyse</SheetEyebrow>

      <MenuRow
        size="lg"
        chevron
        label="Mon signe"
        sublabel="Ton ciel de naissance"
        icon={<Sparkles className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('resume')}
      />
      <MenuRow
        size="lg"
        chevron
        label="Carte"
        sublabel="Roue des constellations"
        icon={<Map className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('carte')}
      />
      <MenuRow
        size="lg"
        chevron
        label="Lecture"
        sublabel="Comprendre ta carte"
        icon={<BookOpen className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('lecture')}
      />

      <Divider />

      <MenuRow
        size="lg"
        chevron
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
