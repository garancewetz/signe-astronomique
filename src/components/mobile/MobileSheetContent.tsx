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
import type { ReportPanelKey } from '@/features/natal-report';
import type { SelectedBody } from '@/features/space-viewport';
import { MenuRow } from '../ui';
import { useCockpitDisplay } from '../../context/useCockpitDisplay';
import { useT } from '../../context/useLocale';
import type { MobileTabKey } from './MobileTabBar';

interface MobileSheetContentProps {
  activeTab: MobileTabKey | null;

  hasReading: boolean;
  onOpenCoords: () => void;
  onSelectAnalysisPanel: (panel: ReportPanelKey) => void;

  // Navigation
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  // Selection
  selectedBody: SelectedBody | null;
  onCloseSelection: () => void;
}

export function MobileSheetContent(props: MobileSheetContentProps) {
  const { activeTab } = props;

  if (activeTab === 'selection') return <SelectionContent {...props} />;
  if (activeTab === 'display') return <DisplayContent />;
  if (activeTab === 'navigation') return <NavigationContent {...props} />;
  if (activeTab === 'analysis') return <AnalysisContent {...props} />;
  return <HomeContent {...props} />;
}

function HomeContent({
  hasReading,
  onOpenCoords,
}: MobileSheetContentProps) {
  const t = useT();
  return (
    <SheetSection>
      <SheetEyebrow>{t.mobile.sheet.home.eyebrow}</SheetEyebrow>

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
        {hasReading ? t.mobile.sheet.home.ctaModifyCoords : t.mobile.sheet.home.ctaCalculate}
      </button>

      <p className="pt-2 text-cockpit-xs text-slate-400/85 leading-relaxed">
        {t.mobile.sheet.home.hint}
      </p>
    </SheetSection>
  );
}

function SelectionContent({
  selectedBody,
  onCloseSelection,
}: MobileSheetContentProps) {
  const t = useT();
  const { sideViewActive, toggleSideView } = useCockpitDisplay();
  if (!selectedBody) {
    return (
      <SheetSection>
        <SheetEyebrow>{t.mobile.sheet.selection.eyebrow}</SheetEyebrow>
        <p className="text-cockpit-sm text-slate-400/85 leading-relaxed">
          {t.mobile.sheet.selection.empty}
        </p>
      </SheetSection>
    );
  }
  return (
    <BodyInfoHud
      variant="inline"
      selected={selectedBody}
      sideViewActive={sideViewActive}
      onToggleSideView={toggleSideView}
      onClose={onCloseSelection}
    />
  );
}

function DisplayContent() {
  const t = useT();
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
    hasSelectedStar,
    sideViewActive,
    toggleSideView,
  } = useCockpitDisplay();
  const orbitalSublabel = !orbitalAvailable
    ? t.mobile.sheet.display.orbital.sublabelUnavailable
    : orbitalStatus === 'loading'
      ? t.mobile.sheet.display.orbital.sublabelLoading
      : orbitalStatus === 'error'
        ? t.mobile.sheet.display.orbital.sublabelError
        : t.mobile.sheet.display.orbital.sublabelLive;

  return (
    <SheetSection>
      <SheetEyebrow>{t.mobile.sheet.display.eyebrow}</SheetEyebrow>

      <MenuRow
        kind="toggle"
        size="lg"
        label={t.mobile.sheet.display.labels.label}
        sublabel={t.mobile.sheet.display.labels.sublabel}
        icon={<Tag className="size-4" strokeWidth={1.35} aria-hidden />}
        active={bodyLabelsEnabled}
        onClick={toggleBodyLabels}
      />
      <MenuRow
        kind="toggle"
        size="lg"
        label={t.mobile.sheet.display.guides.label}
        sublabel={t.mobile.sheet.display.guides.sublabel}
        icon={<Globe2 className="size-4" strokeWidth={1.35} aria-hidden />}
        active={guidesEnabled}
        onClick={toggleGuides}
      />
      <MenuRow
        kind="toggle"
        size="lg"
        label={t.mobile.sheet.display.orbital.label}
        sublabel={orbitalSublabel}
        icon={<Network className="size-4" strokeWidth={1.4} aria-hidden />}
        active={constellationOverlayEnabled}
        locked={!orbitalAvailable}
        disabled={!orbitalAvailable}
        onClick={orbitalAvailable ? toggleConstellationOverlay : undefined}
      />
      <MenuRow
        kind="toggle"
        size="lg"
        label={t.mobile.sheet.display.relics.label}
        sublabel={t.mobile.sheet.display.relics.sublabel}
        icon={<Satellite className="size-4" strokeWidth={1.4} aria-hidden />}
        active={satellitesEnabled}
        onClick={toggleSatellites}
      />

      <Divider />

      <MenuRow
        kind="toggle"
        size="lg"
        label={t.mobile.sheet.display.sideView.label}
        sublabel={
          hasSelectedStar
            ? t.mobile.sheet.display.sideView.sublabelReady
            : t.mobile.sheet.display.sideView.sublabelLocked
        }
        icon={<Axis3d className="size-4" strokeWidth={1.4} aria-hidden />}
        active={sideViewActive}
        locked={!hasSelectedStar}
        disabled={!hasSelectedStar}
        onClick={hasSelectedStar ? toggleSideView : undefined}
      />
    </SheetSection>
  );
}

function NavigationContent({
  onFlySun,
  onFlyMoon,
  onFlyEarth,
}: MobileSheetContentProps) {
  const t = useT();
  return (
    <SheetSection>
      <SheetEyebrow>{t.mobile.sheet.navigation.eyebrow}</SheetEyebrow>

      <MenuRow
        size="lg"
        chevron
        label={t.mobile.sheet.navigation.sun.label}
        sublabel={t.mobile.sheet.navigation.sun.sublabel}
        icon={<span className="text-cockpit-glyph leading-none text-glyph-sun">☀</span>}
        onClick={onFlySun}
      />
      <MenuRow
        size="lg"
        chevron
        label={t.mobile.sheet.navigation.moon.label}
        sublabel={t.mobile.sheet.navigation.moon.sublabel}
        icon={<span className="text-cockpit-glyph leading-none text-glyph-moon">☾</span>}
        onClick={onFlyMoon}
      />
      <MenuRow
        size="lg"
        chevron
        label={t.mobile.sheet.navigation.earth.label}
        sublabel={t.mobile.sheet.navigation.earth.sublabel}
        icon={<span className="text-cockpit-glyph leading-none text-glyph-earth">⊕</span>}
        onClick={onFlyEarth}
      />
    </SheetSection>
  );
}

function AnalysisContent({
  onSelectAnalysisPanel,
}: MobileSheetContentProps) {
  const t = useT();
  return (
    <SheetSection>
      <SheetEyebrow>{t.mobile.sheet.analysis.eyebrow}</SheetEyebrow>

      <MenuRow
        size="lg"
        chevron
        label={t.mobile.sheet.analysis.resume.label}
        sublabel={t.mobile.sheet.analysis.resume.sublabel}
        icon={<Sparkles className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('resume')}
      />
      <MenuRow
        size="lg"
        chevron
        label={t.mobile.sheet.analysis.carte.label}
        sublabel={t.mobile.sheet.analysis.carte.sublabel}
        icon={<Map className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('carte')}
      />
      <MenuRow
        size="lg"
        chevron
        label={t.mobile.sheet.analysis.lecture.label}
        sublabel={t.mobile.sheet.analysis.lecture.sublabel}
        icon={<BookOpen className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('lecture')}
      />

      <Divider />

      <MenuRow
        size="lg"
        chevron
        label={t.mobile.sheet.analysis.donnees.label}
        sublabel={t.mobile.sheet.analysis.donnees.sublabel}
        icon={<Atom className="size-4" strokeWidth={1.4} aria-hidden />}
        onClick={() => onSelectAnalysisPanel('donnees')}
      />
    </SheetSection>
  );
}

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
