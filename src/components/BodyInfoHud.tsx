import { useMemo, type ReactNode } from 'react';
import {
  CONSTELLATION_CATALOG,
  abbrToZodiacal,
  type CatalogConstellation,
  type CatalogStar,
} from '../data/constellationCatalog';
import { CONSTELLATION_LORE } from '../utils/constellationLore';
import { AU_KM } from '../utils/skyCoordinates';
import type {
  SelectedBody,
  SelectedMoon,
  SelectedPlanet,
  SelectedSatellite,
  SelectedStar,
  SelectedSun,
} from './space/SpaceView';
import { Button, HudCard, type HudCardVariant, cn } from './ui';

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
export function BodyInfoHud({
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
}

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
  const resolved = useMemo(() => resolveStar(selected), [selected]);
  if (!resolved) return null;
  const { star, constellation, closest, ratio } = resolved;
  const localizedName = (() => {
    const zodiacal = abbrToZodiacal(constellation.abbreviation);
    return zodiacal ? CONSTELLATION_LORE[zodiacal].fr : constellation.name;
  })();
  const isClosestSelf = star === closest;
  const ratioText = isClosestSelf
    ? `étoile la plus proche du dessin`
    : `${ratio < 10 ? ratio.toFixed(1) : Math.round(ratio)}× plus loin que ${closest.name} (${formatLightYears(closest.distance_ly)})`;

  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel="Fermer le panneau étoile"
      subtitle={
        <>ÉTOILE · {constellation.abbreviation.toUpperCase()} · {localizedName}</>
      }
      title={
        <>
          <span className="text-accent-label mr-1.5 font-mono">{star.bayer}</span>
          {star.name}
        </>
      }
      footer={
        <p className="text-cockpit-xs text-slate-500 leading-snug">
          Bascule sur l'axe pour voir le dessin se disloquer : depuis la Terre,
          les étoiles semblent alignées ; vues de côté, elles sont séparées
          par des centaines d'années-lumière.
        </p>
      }
    >
      <InfoGrid
        rows={[
          { label: 'DISTANCE', value: formatLightYears(star.distance_ly) },
          { label: 'MAGNITUDE', value: star.mag.toFixed(2) },
          { label: 'PROFONDEUR', value: ratioText },
        ]}
      />
      <ModeToggle
        label="PERSPECTIVE_AXIALE"
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
  const constellationFr = CONSTELLATION_LORE[selected.constellation].fr;
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel="Fermer le panneau Soleil"
      subtitle={<>ÉTOILE HÔTE</>}
      title={
        <>
          <span className="text-glyph-sun mr-1.5">☀</span>
          {selected.name}
        </>
      }
      footer={
        <p className="text-cockpit-xs text-slate-500 leading-snug">
          L'étoile la plus proche : 8 minutes-lumière. Sa lumière éclaire le
          ciel diurne et masque toutes les autres.
        </p>
      }
    >
      <InfoGrid
        rows={[
          {
            label: 'CONSTELLATION',
            value: `${constellationFr} (${selected.constellation})`,
          },
          { label: 'DISTANCE', value: formatAU(1) },
          { label: 'RA / DEC', value: formatRaDec(selected.raHours, selected.decDeg) },
          { label: 'MAGNITUDE', value: '−26,7' },
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
  const constellationFr = CONSTELLATION_LORE[selected.constellation].fr;
  const illumPct = `${Math.round(selected.illumination * 100)} %`;
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel="Fermer le panneau Lune"
      subtitle={<>SATELLITE NATUREL</>}
      title={
        <>
          <span className="text-glyph-moon mr-1.5">☾</span>
          {selected.name}
        </>
      }
    >
      <InfoGrid
        rows={[
          {
            label: 'CONSTELLATION',
            value: `${constellationFr} (${selected.constellation})`,
          },
          { label: 'DISTANCE', value: formatKm(selected.distanceKm) },
          { label: 'PHASE', value: `${selected.phaseName} · ${illumPct}` },
          { label: 'RA / DEC', value: formatRaDec(selected.raHours, selected.decDeg) },
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
  const constellationFr = CONSTELLATION_LORE[selected.constellation].fr;
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel={`Fermer le panneau ${selected.name}`}
      subtitle={<>PLANÈTE</>}
      title={
        <>
          <span className="mr-1.5" style={{ color: selected.color }}>
            {selected.glyph}
          </span>
          {selected.name}
        </>
      }
    >
      <InfoGrid
        rows={[
          {
            label: 'CONSTELLATION',
            value: `${constellationFr} (${selected.constellation})`,
          },
          { label: 'DISTANCE', value: formatAU(selected.distanceAU) },
          { label: 'RA / DEC', value: formatRaDec(selected.raHours, selected.decDeg) },
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
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      onClose={onClose}
      closeAriaLabel={`Fermer le panneau ${selected.name}`}
      subtitle={<>RELIQUE ORBITALE</>}
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
          { label: 'LANCEMENT', value: formatLaunchDate(selected.launchDate) },
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

function formatLightYears(ly: number): string {
  if (ly >= 1000) return `${(ly / 1000).toFixed(1)} kal`;
  if (ly >= 100) return `${Math.round(ly).toLocaleString('fr-FR')} al`;
  if (ly >= 10) return `${ly.toFixed(0)} al`;
  return `${ly.toFixed(1)} al`;
}

function formatAU(au: number): string {
  if (au < 0.1)
    return `${(au * AU_KM).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} km`;
  return `${au.toFixed(au < 1 ? 3 : 2)} UA`;
}

function formatKm(km: number): string {
  return `${km.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} km`;
}

function formatLaunchDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('fr-FR', {
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
