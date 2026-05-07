import { useMemo } from 'react';
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
  SelectedStar,
  SelectedSun,
} from './space/SpaceView';
import { Button, PanelShell, cn } from './ui';

interface Props {
  selected: SelectedBody | null;
  depthViewActive: boolean;
  onToggleDepthView: () => void;
  sideViewActive: boolean;
  onToggleSideView: () => void;
  onClose: () => void;
}

interface InfoRow {
  label: string;
  value: React.ReactNode;
}

/**
 * Renders the panel content for the currently selected body — its
 * caller (the right rail's docked container in Cockpit) provides the
 * surrounding chrome and slide-out animation. Dispatches on the
 * selected body's `kind` to render the relevant facts:
 *   - star: name, magnitude, distance (ly), depth comparison + projection toggle.
 *   - sun / moon / planet: name, constellation, distance, body-specific
 *     fields (illumination, phase, glyph…).
 */
export function BodyInfoHud({
  selected,
  depthViewActive,
  onToggleDepthView,
  sideViewActive,
  onToggleSideView,
  onClose,
}: Props) {
  if (!selected) return null;

  switch (selected.kind) {
    case 'star':
      return (
        <StarPanel
          selected={selected}
          depthViewActive={depthViewActive}
          onToggleDepthView={onToggleDepthView}
          sideViewActive={sideViewActive}
          onToggleSideView={onToggleSideView}
          onClose={onClose}
        />
      );
    case 'sun':
      return <SunPanel selected={selected} onClose={onClose} />;
    case 'moon':
      return <MoonPanel selected={selected} onClose={onClose} />;
    case 'planet':
      return <PlanetPanel selected={selected} onClose={onClose} />;
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

function StarPanel({
  selected,
  depthViewActive,
  onToggleDepthView,
  sideViewActive,
  onToggleSideView,
  onClose,
}: {
  selected: SelectedStar;
  depthViewActive: boolean;
  onToggleDepthView: () => void;
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
    <PanelShell
      title={
        <span className="text-cockpit-md tracking-wide text-slate-100 truncate inline-block max-w-full">
          <span className="text-accent-label mr-1.5 font-mono">{star.bayer}</span>
          {star.name}
        </span>
      }
      subtitle={
        <span className="text-cockpit-xs tracking-cockpit-caps text-accent-label/80">
          ÉTOILE · {constellation.abbreviation.toUpperCase()} · {localizedName}
        </span>
      }
      onClose={onClose}
      closeAriaLabel="Fermer le panneau étoile"
      animated={false}
      bodyClassName="overflow-y-auto p-4 space-y-3"
    >
      <InfoGrid
        rows={[
          { label: 'DISTANCE', value: formatLightYears(star.distance_ly) },
          { label: 'MAGNITUDE', value: star.mag.toFixed(2) },
          { label: 'PROFONDEUR', value: ratioText },
        ]}
      />

      <DepthToggle
        label="PROJECTION_PROFONDEUR"
        active={depthViewActive}
        onToggle={onToggleDepthView}
      />
      <DepthToggle
        label="PERSPECTIVE_AXIALE"
        active={sideViewActive}
        onToggle={onToggleSideView}
      />

      <p className="text-cockpit-xs text-slate-500 leading-snug">
        Bascule sur l'axe pour voir le dessin se disloquer : depuis la Terre,
        les étoiles semblent alignées ; vues de côté, elles sont séparées
        par des centaines d'années-lumière.
      </p>
    </PanelShell>
  );
}

// ─── Sun ─────────────────────────────────────────────────────────────────────

function SunPanel({ selected, onClose }: { selected: SelectedSun; onClose: () => void }) {
  const constellationFr = CONSTELLATION_LORE[selected.constellation].fr;
  return (
    <PanelShell
      title={
        <span className="text-cockpit-md tracking-wide text-slate-100">
          <span className="text-glyph-sun mr-1.5">☀</span>
          {selected.name}
        </span>
      }
      subtitle={<span className="text-cockpit-xs tracking-cockpit-caps text-accent-label/80">ÉTOILE HÔTE</span>}
      onClose={onClose}
      closeAriaLabel="Fermer le panneau Soleil"
      animated={false}
      bodyClassName="overflow-y-auto p-4 space-y-3"
    >
      <InfoGrid
        rows={[
          { label: 'CONSTELLATION', value: `${constellationFr} (${selected.constellation})` },
          { label: 'DISTANCE', value: formatAU(1) },
          { label: 'RA / DEC', value: formatRaDec(selected.raHours, selected.decDeg) },
          { label: 'MAGNITUDE', value: '−26,7' },
        ]}
      />
      <p className="text-cockpit-xs text-slate-500 leading-snug">
        L'étoile la plus proche : 8 minutes-lumière. Sa lumière éclaire le
        ciel diurne et masque toutes les autres.
      </p>
    </PanelShell>
  );
}

// ─── Moon ────────────────────────────────────────────────────────────────────

function MoonPanel({ selected, onClose }: { selected: SelectedMoon; onClose: () => void }) {
  const constellationFr = CONSTELLATION_LORE[selected.constellation].fr;
  const illumPct = `${Math.round(selected.illumination * 100)} %`;
  return (
    <PanelShell
      title={
        <span className="text-cockpit-md tracking-wide text-slate-100">
          <span className="text-glyph-moon mr-1.5">☾</span>
          {selected.name}
        </span>
      }
      subtitle={<span className="text-cockpit-xs tracking-cockpit-caps text-accent-label/80">SATELLITE NATUREL</span>}
      onClose={onClose}
      closeAriaLabel="Fermer le panneau Lune"
      animated={false}
      bodyClassName="overflow-y-auto p-4 space-y-3"
    >
      <InfoGrid
        rows={[
          { label: 'CONSTELLATION', value: `${constellationFr} (${selected.constellation})` },
          { label: 'DISTANCE', value: formatKm(selected.distanceKm) },
          { label: 'PHASE', value: `${selected.phaseName} · ${illumPct}` },
          { label: 'RA / DEC', value: formatRaDec(selected.raHours, selected.decDeg) },
        ]}
      />
    </PanelShell>
  );
}

// ─── Planet ──────────────────────────────────────────────────────────────────

function PlanetPanel({
  selected,
  onClose,
}: {
  selected: SelectedPlanet;
  onClose: () => void;
}) {
  const constellationFr = CONSTELLATION_LORE[selected.constellation].fr;
  return (
    <PanelShell
      title={
        <span className="text-cockpit-md tracking-wide text-slate-100">
          <span className="mr-1.5" style={{ color: selected.color }}>{selected.glyph}</span>
          {selected.name}
        </span>
      }
      subtitle={<span className="text-cockpit-xs tracking-cockpit-caps text-accent-label/80">PLANÈTE</span>}
      onClose={onClose}
      closeAriaLabel={`Fermer le panneau ${selected.name}`}
      animated={false}
      bodyClassName="overflow-y-auto p-4 space-y-3"
    >
      <InfoGrid
        rows={[
          { label: 'CONSTELLATION', value: `${constellationFr} (${selected.constellation})` },
          { label: 'DISTANCE', value: formatAU(selected.distanceAU) },
          { label: 'RA / DEC', value: formatRaDec(selected.raHours, selected.decDeg) },
        ]}
      />
    </PanelShell>
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

function DepthToggle({
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
        'w-full justify-between',
        active &&
          'border-sky-300/65 text-sky-100 bg-sky-400/14 hover:bg-sky-400/20',
      )}
    >
      <span>{label}</span>
      <DepthSwitchKnob active={active} />
    </Button>
  );
}

function DepthSwitchKnob({ active }: { active: boolean }) {
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
  if (au < 0.1) return `${(au * AU_KM).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} km`;
  return `${au.toFixed(au < 1 ? 3 : 2)} UA`;
}

function formatKm(km: number): string {
  return `${km.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} km`;
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
