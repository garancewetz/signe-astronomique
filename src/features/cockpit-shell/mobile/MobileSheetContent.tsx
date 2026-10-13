import {
  Globe2,
  Satellite,
  Tag,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { BodyInfoHud } from '../BodyInfoHud';
import type { SelectedBody } from '@/features/space-viewport';
import { Button, MenuRow, cn } from '@/ui';
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
          className="w-full text-cockpit-sm"
        >
          <span aria-hidden className="text-violet-200/90 leading-none">✦</span>
          {t.mobile.sheet.home.ctaCalculate}
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
  onCloseSelection,
}: MobileSheetContentProps) {
  const { sideViewActive, toggleSideView } = useCockpitDisplay();
  if (!selectedBody) return null;
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

function ExploreContent({
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
    satellitesEnabled,
    toggleSatellites,
  } = useCockpitDisplay();
  const destinations = [
    { key: 'sun', glyph: '☀', glyphClass: 'text-glyph-sun', label: t.mobile.sheet.navigation.sun.label, onClick: onFlySun },
    { key: 'moon', glyph: '☾', glyphClass: 'text-glyph-moon', label: t.mobile.sheet.navigation.moon.label, onClick: onFlyMoon },
    { key: 'earth', glyph: '⊕', glyphClass: 'text-glyph-earth', label: t.mobile.sheet.navigation.earth.label, onClick: onFlyEarth },
  ];

  return (
    <SheetSection>
      <SheetEyebrow>{t.mobile.sheet.navigation.eyebrow}</SheetEyebrow>
      <div className="grid grid-cols-3 gap-2 pb-3">
        {destinations.map((d) => (
          <Button
            key={d.key}
            variant="outline"
            onClick={d.onClick}
            className="h-16 flex-col gap-1 tracking-normal"
          >
            <span aria-hidden className={cn('text-xl leading-none', d.glyphClass)}>{d.glyph}</span>
            <span className="text-cockpit-md text-slate-200">{d.label}</span>
          </Button>
        ))}
      </div>

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
        label={t.mobile.sheet.display.relics.label}
        sublabel={t.mobile.sheet.display.relics.sublabel}
        icon={<Satellite className="size-4" strokeWidth={1.4} aria-hidden />}
        active={satellitesEnabled}
        onClick={toggleSatellites}
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
