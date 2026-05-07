import { X } from 'lucide-react';
import { PLANETS_META } from '../utils/astroEngine';
import { SATELLITE_RELICS } from '../data/satellitesDB';
import { ORBITAL_CATEGORIES } from '../data/orbitalCategories';
import { PanelShell } from './ui';

interface LegendPanelProps {
  onClose: () => void;
}

/**
 * Reference panel — pure dictionary of glyphs, colors and layer keys.
 * The actual layer toggles (guides, names, orbital, relics) live in the
 * sidebar's CHRONOLOGIE / NAVIGATION sections, so this panel is read-only.
 */
export function LegendPanel({ onClose }: LegendPanelProps) {
  const planetEntries = Object.values(PLANETS_META);
  return (
    <PanelShell
      title="LÉGENDE"
      subtitle="SYMBOLES · COULEURS · CALQUES"
      onClose={onClose}
      closeAriaLabel="Fermer la légende"
      closeContent={<X className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden />}
      closeButtonClassName="h-8 w-8 p-0"
      bodyClassName="overflow-y-auto px-4 py-4 text-slate-200"
      animationKey="legend"
    >
      <div className="space-y-4 text-cockpit-sm">
        <Section title="ASTRES">
          <Row glyph="☀" color="#fcd34d" name="Soleil" />
          <Row glyph="☾" color="#e2e8f0" name="Lune" />
          {planetEntries.map((p) => (
            <Row key={p.id} glyph={p.glyph} color={p.color} name={p.fr} />
          ))}
        </Section>

        <Section title="REPÈRES DU CIEL">
          <LineRow color="#fde68a" label="Axe terrestre (rotation)" />
          <LineRow color="#60a5fa" label="Équateur céleste" />
          <LineRow color="#fbbf24" label="Écliptique (chemin du Soleil)" />
        </Section>

        <Section title="RELIQUES ORBITALES">
          {SATELLITE_RELICS.map((r) => (
            <DotRow
              key={r.id}
              color={r.glowColor}
              label={r.name}
              year={new Date(r.launchDate).getUTCFullYear()}
            />
          ))}
        </Section>

        <Section title="POPULATION ORBITALE">
          {Object.values(ORBITAL_CATEGORIES).map((cat) => (
            <DotRow key={cat.label} color={cat.hex} label={cat.label} note="temps réel" />
          ))}
        </Section>
      </div>
    </PanelShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-cockpit-xs tracking-cockpit-caps text-accent-label/75 mb-1.5 uppercase">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
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
