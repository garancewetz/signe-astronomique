import { PLANETS_META } from '../utils/astroEngine';
import { SATELLITE_RELICS } from '../data/satellitesDB';
import { ORBITAL_CATEGORIES } from '../data/orbitalCategories';
import { cn, HudCard, type HudCardVariant } from './ui';

interface LegendPanelProps {
  onClose: () => void;
  variant?: HudCardVariant;
  sidebarWidth?: number;
  // Layer toggles — clicking the switch on a section header flips the
  // corresponding display layer in the sky. Mirrors the AFFICHAGE
  // section of the sidebar.
  bodyLabelsEnabled: boolean;
  onToggleBodyLabels: () => void;
  guidesEnabled: boolean;
  onToggleGuides: () => void;
  satellitesEnabled: boolean;
  onToggleSatellites: () => void;
  constellationOverlayEnabled: boolean;
  onToggleConstellationOverlay: () => void;
  orbitalAvailable: boolean;
}

/**
 * Reference card — dictionary of glyphs, colors and layer keys, with a
 * toggle on each section header so the user can switch the
 * corresponding sky layer on or off without leaving the legend. Renders
 * as a floating glassmorphism HUD by default; pass `variant="inline"`
 * to embed inside the mobile bottom sheet.
 */
export function LegendPanel({
  onClose,
  variant = 'floating',
  sidebarWidth = 0,
  bodyLabelsEnabled,
  onToggleBodyLabels,
  guidesEnabled,
  onToggleGuides,
  satellitesEnabled,
  onToggleSatellites,
  constellationOverlayEnabled,
  onToggleConstellationOverlay,
  orbitalAvailable,
}: LegendPanelProps) {
  const planetEntries = Object.values(PLANETS_META);
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      title="LÉGENDE"
      subtitle="SYMBOLES · COULEURS · CALQUES"
      onClose={onClose}
      closeAriaLabel="Fermer la légende"
    >
      <div className="space-y-4 text-cockpit-sm text-slate-200">
        <Section
          title="ASTRES"
          active={bodyLabelsEnabled}
          onToggle={onToggleBodyLabels}
        >
          <Row glyph="☀" color="#fcd34d" name="Soleil" />
          <Row glyph="☾" color="#e2e8f0" name="Lune" />
          {planetEntries.map((p) => (
            <Row key={p.id} glyph={p.glyph} color={p.color} name={p.fr} />
          ))}
        </Section>

        <Section
          title="REPÈRES DU CIEL"
          active={guidesEnabled}
          onToggle={onToggleGuides}
        >
          <LineRow color="#fde68a" label="Axe terrestre (rotation)" />
          <LineRow color="#60a5fa" label="Équateur céleste" />
          <LineRow color="#fbbf24" label="Écliptique (chemin du Soleil)" />
        </Section>

        <Section
          title="RELIQUES ORBITALES"
          active={satellitesEnabled}
          onToggle={onToggleSatellites}
        >
          {SATELLITE_RELICS.map((r) => (
            <DotRow
              key={r.id}
              color={r.glowColor}
              label={r.name}
              year={new Date(r.launchDate).getUTCFullYear()}
            />
          ))}
        </Section>

        <Section
          title="POPULATION ORBITALE"
          active={constellationOverlayEnabled}
          onToggle={onToggleConstellationOverlay}
          disabled={!orbitalAvailable}
        >
          {Object.values(ORBITAL_CATEGORIES).map((cat) => (
            <DotRow key={cat.label} color={cat.hex} label={cat.label} note="temps réel" />
          ))}
        </Section>
      </div>
    </HudCard>
  );
}

function Section({
  title,
  active,
  onToggle,
  disabled = false,
  children,
}: {
  title: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={`${title} — ${active ? 'visible' : 'masqué'}`}
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={cn(
          'cockpit-focus group flex items-center gap-2 w-full mb-1.5',
          'text-cockpit-xs tracking-cockpit-caps uppercase',
          'transition-colors',
          disabled
            ? 'text-accent-label/40 cursor-not-allowed'
            : active
              ? 'text-cyan-100 hover:text-cyan-50'
              : 'text-accent-label/75 hover:text-accent-label',
        )}
      >
        <span className="flex-1 text-left truncate">{title}</span>
        <SwitchKnob active={active} disabled={disabled} />
      </button>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SwitchKnob({ active, disabled }: { active: boolean; disabled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 relative inline-block w-7 h-3 rounded-full transition-colors',
        disabled
          ? 'bg-slate-700/40'
          : active
            ? 'bg-cyan-400/60'
            : 'bg-slate-600/50',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-white shadow transition-[left]',
          active ? 'left-[calc(100%-0.625rem-1px)]' : 'left-px',
        )}
      />
    </span>
  );
}

function Row({ glyph, color, name }: { glyph: string; color: string; name: string }) {
  return (
    <div className="flex items-center gap-3 font-mono">
      <span style={{ color }} className="text-base leading-none w-5 text-center">
        {glyph}
      </span>
      <span className="text-slate-300">{name}</span>
    </div>
  );
}

function LineRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="20" height="6" viewBox="0 0 20 6" className="shrink-0">
        <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="1.5" />
      </svg>
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

function DotRow({
  color,
  label,
  year,
  note,
}: {
  color: string;
  label: string;
  year?: number;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="shrink-0 inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="text-slate-300 truncate">{label}</span>
      {note && <span className="text-slate-500 ml-auto text-cockpit-sm shrink-0">{note}</span>}
      {year !== undefined && !note && (
        <span className="text-slate-500 ml-auto text-cockpit-sm">{year}</span>
      )}
    </div>
  );
}
