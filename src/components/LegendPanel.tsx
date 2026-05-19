import { PLANETS_META } from '../utils/astroEngine';
import { SATELLITE_RELICS, satelliteName } from '../data/satellitesDB';
import { ORBITAL_CATEGORIES, orbitalCategoryLabel } from '../data/orbitalCategories';
import { cn, HudCard, type HudCardVariant } from './ui';
import { useLocale, useT } from '../context/useLocale';
import { useCockpitDisplay } from '../context/useCockpitDisplay';

interface LegendPanelProps {
  onClose: () => void;
  variant?: HudCardVariant;
  sidebarWidth?: number;
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
}: LegendPanelProps) {
  const t = useT();
  const { locale } = useLocale();
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
  } = useCockpitDisplay();
  const planetEntries = Object.values(PLANETS_META);
  return (
    <HudCard
      variant={variant}
      sidebarWidth={sidebarWidth}
      title={t.legend.title}
      subtitle={t.legend.subtitle}
      onClose={onClose}
      closeAriaLabel={t.panels.legend.closeAriaLabel}
    >
      <div className="space-y-4 text-cockpit-sm text-slate-200">
        <Section
          title={t.legend.sections.bodies}
          active={bodyLabelsEnabled}
          onToggle={toggleBodyLabels}
        >
          <Row glyph="☀" color="#fcd34d" name={t.legend.bodyLabels.sun} />
          <Row glyph="☾" color="#e2e8f0" name={t.legend.bodyLabels.moon} />
          {planetEntries.map((p) => (
            <Row
              key={p.id}
              glyph={p.glyph}
              color={p.color}
              name={locale === 'en' ? p.en : p.fr}
            />
          ))}
        </Section>

        <Section
          title={t.legend.sections.guides}
          active={guidesEnabled}
          onToggle={toggleGuides}
        >
          <LineRow color="#fde68a" label={t.legend.guideLabels.axis} />
          <LineRow color="#60a5fa" label={t.legend.guideLabels.equator} />
          <LineRow color="#fbbf24" label={t.legend.guideLabels.ecliptic} />
        </Section>

        <Section
          title={t.legend.sections.relics}
          active={satellitesEnabled}
          onToggle={toggleSatellites}
        >
          {SATELLITE_RELICS.map((r) => (
            <DotRow
              key={r.id}
              color={r.glowColor}
              label={satelliteName(r, locale)}
              year={new Date(r.launchDate).getUTCFullYear()}
            />
          ))}
        </Section>

        <Section
          title={t.legend.sections.orbital}
          active={constellationOverlayEnabled}
          onToggle={toggleConstellationOverlay}
          disabled={!orbitalAvailable}
        >
          {Object.values(ORBITAL_CATEGORIES).map((cat) => (
            <DotRow
              key={cat.label}
              color={cat.hex}
              label={orbitalCategoryLabel(cat, locale)}
              note={t.legend.orbitalRealTime}
            />
          ))}
        </Section>

        <KeyboardSection />
      </div>
    </HudCard>
  );
}

function KeyboardSection() {
  const t = useT();
  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 w-full mb-1.5',
          'text-cockpit-xs tracking-cockpit-caps uppercase',
          'text-accent-label/75',
        )}
      >
        <span className="flex-1 text-left truncate">
          {t.keyboardShortcuts.sectionLabel.toUpperCase()}
        </span>
      </div>
      <ul className="space-y-1 text-cockpit-sm">
        {t.keyboardShortcuts.rows.map((row) => (
          <li key={row.keys} className="flex items-center gap-3">
            <kbd
              className={cn(
                'shrink-0 inline-flex items-center justify-center min-w-26',
                'px-1.5 py-0.5 rounded',
                'border border-border-hud-faint bg-surface-console/55',
                'font-mono text-cockpit-sm tracking-tight text-slate-100',
              )}
            >
              {row.keys}
            </kbd>
            <span className="text-slate-300">{row.desc}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-cockpit-xs text-slate-500 leading-relaxed">
        {t.keyboardShortcuts.sideViewNote}
      </p>
    </div>
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
  const t = useT();
  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={`${title} — ${active ? t.legend.toggleVisible : t.legend.toggleHidden}`}
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
