import { memo, useMemo, type ReactNode } from 'react';
import {
  AU_KM,
  CONSTELLATION_CATALOG,
  PLANETS_META,
  abbrToZodiacal,
  formatDistanceKmOrAU,
  loreName,
  type CatalogConstellation,
  type CatalogStar,
  type MoonPhaseKey,
} from '@/features/astronomy';
import type {
  SelectedBody,
  SelectedMoon,
  SelectedPlanet,
  SelectedSatellite,
  SelectedStar,
  SelectedSun,
} from '@/features/space-viewport';
import { Button, HudCard, type HudCardVariant, cn } from '@/ui';
import { useLocale, useT } from '@/context/useLocale';
import type { Copy } from '@/i18n/fr';
import type { Locale } from '@/i18n';

interface Props {
  selected: SelectedBody | null;
  /** Distance in px from the left edge to the floating card. Required when `variant === 'floating'`. */
  sidebarWidth?: number;
  sideViewActive: boolean;
  onToggleSideView: () => void;
  onClose: () => void;
  /**
   * `floating` (default): absolute-positioned glassmorphism card anchored
   * left of the sky map, with slide+fade entry animation. `inline`:
   * static block suitable for embedding (e.g. inside the mobile bottom
   * sheet) — same chrome, no positioning, no animation.
   */
  variant?: 'floating' | 'inline';
}

interface InfoRow {
  label: string;
  value: ReactNode;
}

/**
 * Floating "HUD" card for the currently selected body. Renders as a
 * left-anchored glassmorphism overlay (auto height, fixed width) that
 * floats above the sky map instead of pushing the canvas. Dispatches
 * on the body's `kind` to surface the relevant facts.
 */
export const BodyInfoHud = memo(function BodyInfoHud({
  selected,
  sidebarWidth = 0,
  sideViewActive,
  onToggleSideView,
  onClose,
  variant = 'floating',
}: Props) {
  if (!selected) return null;

  const shellProps = { sidebarWidth, variant } as const;
  switch (selected.kind) {
    case 'star':
      return (
        <StarCard
          selected={selected}
          sideViewActive={sideViewActive}
          onToggleSideView={onToggleSideView}
          onClose={onClose}
          {...shellProps}
        />
      );
    case 'sun':
      return <SunCard selected={selected} onClose={onClose} {...shellProps} />;
    case 'moon':
      return <MoonCard selected={selected} onClose={onClose} {...shellProps} />;
    case 'planet':
      return <PlanetCard selected={selected} onClose={onClose} {...shellProps} />;
    case 'satellite':
      return (
        <SatelliteCard selected={selected} onClose={onClose} {...shellProps} />
      );
  }
});

// ─── Star ────────────────────────────────────────────────────────────────────

interface ResolvedStar {
  star: CatalogStar;
  constellation: CatalogConstellation;
  closest: CatalogStar;
  ratio: number;
}

function resolveStar(selected: SelectedStar): ResolvedStar | null {
  const constellation = CONSTELLATION_CATALOG.find(
    (c) => c.abbreviation === selected.constellationAbbr,
  );
  if (!constellation) return null;
  const star = constellation.stars[selected.starIndex];
  if (!star) return null;
  const closest = constellation.stars.reduce(
    (acc, s) => (s.distance_ly < acc.distance_ly ? s : acc),
    constellation.stars[0],
  );
  const ratio = closest.distance_ly > 0 ? star.distance_ly / closest.distance_ly : 1;
  return { star, constellation, closest, ratio };
}

function StarCard({
  selected,
  sidebarWidth,
  variant,
  sideViewActive,
  onToggleSideView,
  onClose,
}: {
  selected: SelectedStar;
  sidebarWidth: number;
  variant: HudCardVariant;
  sideViewActive: boolean;
  onToggleSideView: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const resolved = useMemo(() => resolveStar(selected), [selected]);
  if (!resolved) return null;
  const { star, constellation, closest, ratio } = resolved;
  const localizedName = (() => {
    const zodiacal = abbrToZodiacal(constellation.abbreviation);
    return zodiacal ? loreName(zodiacal, locale) : constellation.name;
  })();
  const isClosestSelf = star === closest;
  const ratioText = isClosestSelf
    ? t.bodyInfo.star.closestSelf
    : t.bodyInfo.star.ratioFarther(
        ratio < 10 ? ratio.toFixed(1) : Math.round(ratio).toString(),
        closest.name,
        formatLightYears(closest.distance_ly, locale),
      );

  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel={t.panels.body.closeStar}
      subtitle={
        <>{t.bodyInfo.star.eyebrowPrefix} · {constellation.abbreviation.toUpperCase()} · {localizedName}</>
      }
      title={
        <>
          <span className="text-accent-label mr-1.5 font-mono">{star.bayer}</span>
          {star.name}
        </>
      }
      footer={
        <p className="text-cockpit-xs text-slate-500 leading-snug">
          {t.bodyInfo.star.footer}
        </p>
      }
    >
      <InfoGrid
        rows={[
          { label: t.bodyInfo.star.rows.distance, value: formatLightYears(star.distance_ly, locale) },
          { label: t.bodyInfo.star.rows.magnitude, value: star.mag.toFixed(2) },
          { label: t.bodyInfo.star.rows.depth, value: ratioText },
        ]}
      />
      <ModeToggle
        label={t.bodyInfo.star.modeToggleLabel}
        active={sideViewActive}
        onToggle={onToggleSideView}
      />
    </HudCard>
  );
}

// ─── Sun ─────────────────────────────────────────────────────────────────────

function SunCard({
  selected,
  sidebarWidth,
  variant,
  onClose,
}: {
  selected: SelectedSun;
  sidebarWidth: number;
  variant: HudCardVariant;
  onClose: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const constellationLabel = loreName(selected.constellation, locale);
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel={t.panels.body.closeSun}
      subtitle={<>{t.bodyInfo.sun.eyebrow}</>}
      title={
        <>
          <span className="text-glyph-sun mr-1.5">☀</span>
          {t.bodies.sun}
        </>
      }
      footer={
        <p className="text-cockpit-xs text-slate-500 leading-snug">
          {t.bodyInfo.sun.footer}
        </p>
      }
    >
      <InfoGrid
        rows={[
          {
            label: t.bodyInfo.sun.rows.constellation,
            value: `${constellationLabel} (${selected.constellation})`,
          },
          { label: t.bodyInfo.sun.rows.distance, value: formatAU(1, locale) },
          { label: t.bodyInfo.sun.rows.raDec, value: formatRaDec(selected.raHours, selected.decDeg) },
          { label: t.bodyInfo.sun.rows.magnitude, value: t.bodyInfo.sun.magnitudeValue },
        ]}
      />
    </HudCard>
  );
}

// ─── Moon ────────────────────────────────────────────────────────────────────

function MoonCard({
  selected,
  sidebarWidth,
  variant,
  onClose,
}: {
  selected: SelectedMoon;
  sidebarWidth: number;
  variant: HudCardVariant;
  onClose: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const constellationLabel = loreName(selected.constellation, locale);
  const illumPct = `${Math.round(selected.illumination * 100)} %`;
  const phaseLabel = t.moonPhases[selected.phaseKey as MoonPhaseKey] ?? selected.phaseKey;
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel={t.panels.body.closeMoon}
      subtitle={<>{t.bodyInfo.moon.eyebrow}</>}
      title={
        <>
          <span className="text-glyph-moon mr-1.5">☾</span>
          {t.bodies.moon}
        </>
      }
    >
      <InfoGrid
        rows={[
          {
            label: t.bodyInfo.moon.rows.constellation,
            value: `${constellationLabel} (${selected.constellation})`,
          },
          { label: t.bodyInfo.moon.rows.distance, value: formatKm(selected.distanceKm, locale) },
          { label: t.bodyInfo.moon.rows.phase, value: `${phaseLabel} · ${illumPct}` },
          { label: t.bodyInfo.moon.rows.raDec, value: formatRaDec(selected.raHours, selected.decDeg) },
        ]}
      />
    </HudCard>
  );
}

// ─── Planet ──────────────────────────────────────────────────────────────────

function PlanetCard({
  selected,
  sidebarWidth,
  variant,
  onClose,
}: {
  selected: SelectedPlanet;
  sidebarWidth: number;
  variant: HudCardVariant;
  onClose: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const constellationLabel = loreName(selected.constellation, locale);
  const planetName =
    locale === 'en' ? PLANETS_META[selected.id].en : PLANETS_META[selected.id].fr;
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel={t.panels.body.closeNamed(planetName)}
      subtitle={<>{t.bodyInfo.planet.eyebrow}</>}
      title={
        <>
          <span className="mr-1.5" style={{ color: selected.color }}>
            {selected.glyph}
          </span>
          {planetName}
        </>
      }
    >
      <InfoGrid
        rows={[
          {
            label: t.bodyInfo.planet.rows.constellation,
            value: `${constellationLabel} (${selected.constellation})`,
          },
          { label: t.bodyInfo.planet.rows.distance, value: formatAU(selected.distanceAU, locale) },
          { label: t.bodyInfo.planet.rows.raDec, value: formatRaDec(selected.raHours, selected.decDeg) },
        ]}
      />
    </HudCard>
  );
}

// ─── Satellite ───────────────────────────────────────────────────────────────

function SatelliteCard({
  selected,
  sidebarWidth,
  variant,
  onClose,
}: {
  selected: SelectedSatellite;
  sidebarWidth: number;
  variant: HudCardVariant;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel={t.panels.body.closeNamed(selected.name)}
      subtitle={<>{t.bodyInfo.satellite.eyebrow}</>}
      title={
        <>
          <span
            aria-hidden="true"
            className="inline-block size-2 rounded-full mr-2 align-middle"
            style={{
              backgroundColor: selected.glowColor,
              boxShadow: `0 0 8px 2px ${selected.glowColor}80`,
            }}
          />
          {selected.name}
        </>
      }
      footer={
        <p className="text-cockpit-xs text-slate-500 leading-snug italic">
          {selected.blurb}
        </p>
      }
    >
      <InfoGrid
        rows={[
          { label: t.bodyInfo.satellite.rows.launch, value: formatLaunchDate(selected.launchDate, t) },
        ]}
      />
    </HudCard>
  );
}

// ─── Shared building blocks ──────────────────────────────────────────────────

function InfoGrid({ rows }: { rows: InfoRow[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-cockpit-sm">
      {rows.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-slate-500 tracking-cockpit">{label}</dt>
          <dd className="text-slate-200 text-right text-balance font-mono">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ModeToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      variant={active ? 'solid' : 'outline'}
      size="sm"
      className={cn(
        'w-full justify-between font-mono',
        active &&
          'border-sky-300/65 text-sky-100 bg-sky-400/14 hover:bg-sky-400/20',
      )}
    >
      <span>{label}</span>
      <SwitchKnob active={active} />
    </Button>
  );
}

function SwitchKnob({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-block w-7 h-3 rounded-full transition-colors',
        active ? 'bg-sky-300/70' : 'bg-slate-600/60',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow transition-[left]',
          active ? 'left-[calc(100%-0.625rem-1px)]' : 'left-px',
        )}
      />
    </span>
  );
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatLightYears(ly: number, locale: Locale): string {
  const intl = locale === 'en' ? 'en-US' : 'fr-FR';
  // "al" (année-lumière) in FR, "ly" in EN.
  const unit = locale === 'en' ? 'ly' : 'al';
  const kiloUnit = locale === 'en' ? 'kly' : 'kal';
  if (ly >= 1000) return `${(ly / 1000).toFixed(1)} ${kiloUnit}`;
  if (ly >= 100) return `${Math.round(ly).toLocaleString(intl)} ${unit}`;
  if (ly >= 10) return `${ly.toFixed(0)} ${unit}`;
  return `${ly.toFixed(1)} ${unit}`;
}

function formatAU(au: number, locale: Locale): string {
  return formatDistanceKmOrAU(au * AU_KM, locale);
}

function formatKm(km: number, locale: Locale): string {
  const intl = locale === 'en' ? 'en-US' : 'fr-FR';
  return `${km.toLocaleString(intl, { maximumFractionDigits: 0 })} km`;
}

function formatLaunchDate(iso: string, t: Copy): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(t.intlLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatRaDec(raHours: number, decDeg: number): string {
  const raH = Math.floor(raHours);
  const raM = Math.floor((raHours - raH) * 60);
  const sign = decDeg >= 0 ? '+' : '−';
  const decAbs = Math.abs(decDeg);
  const decD = Math.floor(decAbs);
  const decM = Math.floor((decAbs - decD) * 60);
  return `${raH}h${String(raM).padStart(2, '0')} · ${sign}${decD}°${String(decM).padStart(2, '0')}′`;
}
