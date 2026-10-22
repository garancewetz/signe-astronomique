import {
  Globe2,
  Ruler,
  Satellite,
  Tag,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { BodyInfoHud } from '../BodyInfoHud';
import type { SelectedBody } from '@/features/space-viewport';
import type { IauConstellation } from '@/features/astronomy';
import { Button, cn } from '@/ui';
import { useCockpitDisplay } from '@/context/useCockpitDisplay';
import { useT } from '@/context/useLocale';
import type { MobileTabKey } from './MobileTabBar';

interface MobileSheetContentProps {
  activeTab: MobileTabKey | null;

  hasReading: boolean;
  onOpenCoords: () => void;

  // Navigation
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;

  // Selection
  selectedBody: SelectedBody | null;
  selectedHoroscope?: IauConstellation;
  onCloseSelection: () => void;
}

export function MobileSheetContent(props: MobileSheetContentProps) {
  const { activeTab, selectedBody } = props;

  if (activeTab === 'explore') return <ExploreContent {...props} />;
  // No tab active — show body info contextually when something is picked
  // in the 3D scene; otherwise fall back to the home / CTA screen.
  if (selectedBody) return <SelectionContent {...props} />;
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

      {!hasReading && (
        <Button
          variant="solid"
          size="lg"
          onClick={onOpenCoords}
          className="w-full text-cockpit-lg"
        >
          {`${t.mobile.sheet.home.ctaCalculate} →`}
        </Button>
      )}

      <p className="pt-2 text-cockpit-xs text-slate-400/85 leading-relaxed">
        {t.mobile.sheet.home.hint}
      </p>
    </SheetSection>
  );
}

function SelectionContent({
  selectedBody,
  selectedHoroscope,
  onCloseSelection,
}: MobileSheetContentProps) {
  const { sideViewActive, toggleSideView } = useCockpitDisplay();
  if (!selectedBody) return null;
  return (
    <BodyInfoHud
      variant="inline"
      selected={selectedBody}
      horoscopeSign={selectedHoroscope}
      sideViewActive={sideViewActive}
      onToggleSideView={toggleSideView}
      onClose={onCloseSelection}
    />
  );
}

function ExploreContent({
  hasReading,
  onFlySun,
  onFlyMoon,
  onFlyEarth,
}: MobileSheetContentProps) {
  const t = useT();
  const {
    bodyLabelsEnabled,
    toggleBodyLabels,
    guidesEnabled,
    toggleGuides,
    zonesEnabled,
    toggleZones,
    satellitesEnabled,
    toggleSatellites,
  } = useCockpitDisplay();
  const destinations = [
    { key: 'sun', glyph: '☀', glyphClass: 'text-glyph-sun', label: t.mobile.sheet.navigation.sun.label, onClick: onFlySun },
    { key: 'moon', glyph: '☾', glyphClass: 'text-glyph-moon', label: t.mobile.sheet.navigation.moon.label, onClick: onFlyMoon },
    { key: 'earth', glyph: '⊕', glyphClass: 'text-glyph-earth', label: t.mobile.sheet.navigation.earth.label, onClick: onFlyEarth },
  ];
  const layers = [
    { key: 'labels', icon: Tag, label: t.mobile.sheet.display.labels.label, active: bodyLabelsEnabled, onClick: toggleBodyLabels },
    // Drawn around the reader's own sign: waits for a calculation.
    { key: 'zones', icon: Ruler, label: t.mobile.sheet.display.zones.label, active: zonesEnabled && hasReading, onClick: toggleZones, disabled: !hasReading },
    { key: 'guides', icon: Globe2, label: t.mobile.sheet.display.guides.label, active: guidesEnabled, onClick: toggleGuides },
    { key: 'relics', icon: Satellite, label: t.mobile.sheet.display.relics.label, active: satellitesEnabled, onClick: toggleSatellites },
  ];

  // Compact on purpose: the sheet should leave most of the sky visible
  // while the user plays with it.
  return (
    <SheetSection>
      <SheetEyebrow>{t.mobile.sheet.navigation.eyebrow}</SheetEyebrow>
      <div className="grid grid-cols-3 gap-2 pb-3">
        {destinations.map((d) => (
          <Button
            key={d.key}
            variant="outline"
            onClick={d.onClick}
            className="h-11 gap-2 tracking-normal"
          >
            <span aria-hidden className={cn('text-lg leading-none', d.glyphClass)}>{d.glyph}</span>
            <span className="text-cockpit-md text-slate-200">{d.label}</span>
          </Button>
        ))}
      </div>

      <SheetEyebrow>{t.mobile.sheet.display.eyebrow}</SheetEyebrow>
      <div className="grid grid-cols-2 gap-2">
        {layers.map(({ key, icon: Icon, label, active, onClick, disabled }) => (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'cockpit-focus flex items-center gap-2 min-h-11 px-3 rounded border text-left',
              'text-cockpit-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
              active
                ? 'border-slate-300/60 bg-white/8 text-white'
                : 'border-border-hud-subtle text-slate-400 hover:text-slate-200',
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.4} aria-hidden />
            <span className="min-w-0 leading-tight">{label}</span>
          </button>
        ))}
      </div>
      {!hasReading && (
        <p className="px-1 pt-2 text-cockpit-sm leading-snug text-slate-400">
          {t.sidebar.layers.zonesLocked}
        </p>
      )}
    </SheetSection>
  );
}

function SheetSection({ children }: { children: ReactNode }) {
  return <div className="px-3 pt-1 pb-4 space-y-1">{children}</div>;
}

function SheetEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="px-1 pb-2 text-cockpit-xs tracking-normal text-violet-300/70">
      {children}
    </div>
  );
}
