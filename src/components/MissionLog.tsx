import {
  formatRA,
  getIauBoundaries,
  precessionOffset,
  type CelestialBody,
  type CelestialReading,
} from '../utils/astroEngine';
import { CONSTELLATION_LORE } from '../utils/constellationLore';
import { cn } from './ui/cn';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

function norm360(x: number) { return ((x % 360) + 360) % 360; }

function houseNumber(planetLon: number, ascLon: number): string {
  const n = 1 + Math.floor(norm360(planetLon - ascLon) / 30);
  return ROMAN[(n - 1 + 12) % 12];
}

function degWithinConst(tropLon: number, jd: number): number {
  const sid = norm360(tropLon - precessionOffset(jd));
  const boundaries = getIauBoundaries();
  let start = boundaries[boundaries.length - 1].start;
  for (const b of boundaries) {
    if (sid >= b.start) start = b.start;
  }
  return Math.floor((sid - start + 360) % 360);
}

function getSeason(sunTropLon: number, lat: number): string {
  const isNorth = lat >= 0;
  const idx = Math.floor(norm360(sunTropLon) / 90);
  const n = ['Printemps', 'Été', 'Automne', 'Hiver'];
  const s = ['Automne', 'Hiver', 'Printemps', 'Été'];
  return (isNorth ? n : s)[idx];
}

function getTimeOfDay(localHour: number): string {
  if (localHour >= 6 && localHour < 12) return 'matin';
  if (localHour >= 12 && localHour < 18) return 'après-midi';
  if (localHour >= 18) return 'soirée';
  return 'nuit';
}

/** Extracts the wall-clock hour in `timezone` for a given UTC date. Falls
 *  back to UTC if the timezone is unknown or `Intl` rejects it. */
function localHourIn(date: Date, timezone?: string): number {
  if (!timezone) return date.getUTCHours();
  try {
    const part = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    }).formatToParts(date).find((p) => p.type === 'hour');
    const h = Number(part?.value);
    // Intl can emit "24" for midnight in some locales — normalize to 0.
    return Number.isFinite(h) ? h % 24 : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
}

// ─── En-tête naissance ───────────────────────────────────────────────────────

export function BirthHeader({ reading }: { reading: CelestialReading }) {
  const { date, placeLabel, latitude, longitude, timezone } = reading.input;
  const dateFmt = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: timezone ?? 'UTC',
  });
  const timeFmt = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: timezone ?? 'UTC',
  });
  const dateStr = dateFmt.format(date);
  const timeStr = timezone ? timeFmt.format(date) : `${timeFmt.format(date)} UTC`;

  return (
    <div className="pb-3 border-b border-border-hud-subtle">
      <div className="text-cockpit-sm tracking-cockpit-hud text-violet-400 mb-1.5">
        THÈME ASTRAL · CIEL RÉEL À LA NAISSANCE
      </div>
      <div className="text-white text-cockpit-xl leading-snug font-medium">
        {dateStr} à {timeStr}
      </div>
      {placeLabel && (
        <div className="text-slate-400 text-cockpit-sm mt-0.5 font-mono">
          {placeLabel}&nbsp;
          ({latitude >= 0 ? latitude.toFixed(2) + '° N' : Math.abs(latitude).toFixed(2) + '° S'},&nbsp;
          {longitude >= 0 ? longitude.toFixed(2) + '° E' : Math.abs(longitude).toFixed(2) + '° O'})
        </div>
      )}
    </div>
  );
}

// ─── Résumé : ciel en un coup d'œil ─────────────────────────────────────────

export function ResumeCard({
  reading,
  onRevealConstellation,
}: {
  reading: CelestialReading;
  /** When set, the Sun row becomes a CTA that flies the camera to the
   *  user's constellation in the 3D sky. */
  onRevealConstellation?: () => void;
}) {
  const sunLore = CONSTELLATION_LORE[reading.trueConstellation];
  const moonLore = CONSTELLATION_LORE[reading.moon.constellation];
  const ascLore  = CONSTELLATION_LORE[reading.ascendantConstellation];
  const season   = getSeason(reading.sunEclipticLongitude, reading.input.latitude);
  const timeDay  = getTimeOfDay(localHourIn(reading.input.date, reading.input.timezone));

  return (
    <Section label="TON CIEL EN UN COUP D’ŒIL">
      <div className="px-3 py-2.5 space-y-2">
        <ResumeRow glyph="☉" glyphColor="#fde68a" label="Vrai signe (Soleil)"
          value={sunLore.fr} valueClass="text-yellow-300"
          onReveal={onRevealConstellation} />
        <ResumeRow glyph="☽" glyphColor="#c4b5fd" label="Lune"
          value={`${moonLore.fr} · ${reading.moon.phaseName}`} valueClass="text-violet-200" />
        <ResumeRow glyph="↑" glyphColor="#4ade80" label="Ascendant"
          value={ascLore.fr} valueClass="text-emerald-300" />
        <ResumeRow glyph="◆" glyphColor="#fbbf24" label="Saison · moment"
          value={`${season} · ${timeDay}`} valueClass="text-amber-300" />
      </div>
    </Section>
  );
}

function ResumeRow({ glyph, glyphColor, label, value, valueClass, onReveal }: {
  glyph: string; glyphColor: string;
  label: string; value: string; valueClass: string;
  onReveal?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: glyphColor }}
            className="w-4 text-center shrink-0 text-sm leading-none">
        {glyph}
      </span>
      <span className="text-slate-400 shrink-0 w-36 text-cockpit-sm">{label}</span>
      {onReveal ? (
        <button
          type="button"
          onClick={onReveal}
          aria-label="Voir cette constellation dans le ciel"
          title="Voir cette constellation dans le ciel"
          className={cn(
            'cockpit-focus inline-flex items-center gap-1 rounded-cockpit',
            'font-medium text-cockpit-md transition-opacity hover:opacity-85',
            valueClass,
          )}
        >
          <span>{value}</span>
          <span aria-hidden="true" className="text-cockpit-sm opacity-80">↗</span>
        </button>
      ) : (
        <span className={cn('font-medium text-cockpit-md', valueClass)}>{value}</span>
      )}
    </div>
  );
}

// ─── Ascendant ───────────────────────────────────────────────────────────────

export function AscendantCard({ reading }: { reading: CelestialReading }) {
  const lore = CONSTELLATION_LORE[reading.ascendantConstellation];
  return (
    <div className="border border-emerald-500/30 bg-emerald-900/15 rounded-sm p-3">
      <div className="text-cockpit-md tracking-cockpit-caps text-emerald-400 mb-2">
        ↑ ASCENDANT · HORIZON EST
      </div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-emerald-300 text-sm font-medium">{lore.fr}</span>
        <span className="text-cockpit-sm text-emerald-400/70 font-mono italic">{lore.latin}</span>
      </div>
      <div className="text-cockpit-sm text-emerald-400/60 grid grid-cols-2 gap-x-3 font-mono mt-1.5">
        <span>TS {formatRA(reading.localSiderealTime)}</span>
        <span>φ {reading.input.latitude.toFixed(2)}°</span>
      </div>
    </div>
  );
}

// ─── Comment lire ─────────────────────────────────────────────────────────────

export function HowToRead() {
  return (
    <Section label="COMMENT LIRE TA CARTE DU CIEL">
      <div className="px-3 py-2.5 font-sans text-cockpit-xl leading-relaxed text-slate-300 space-y-2">
        <p>
          Ce que tu vois est le <strong className="text-violet-100 font-medium">ciel
          réel</strong> tel qu&apos;il était au-dessus du lieu, à la date et à
          l&apos;heure de ta naissance — pas un schéma symbolique.
        </p>
        <p className="text-slate-400">
          Active le calque <span className="text-amber-300">Repères</span> dans
          la barre latérale pour voir l&apos;axe de rotation de la Terre,
          l&apos;équateur céleste (sa projection sur la voûte) et
          l&apos;écliptique — la trajectoire apparente du Soleil au fil de
          l&apos;année. Les treize constellations zodiacales sont celles que ce
          chemin traverse.
        </p>
        <p className="text-slate-500">
          Les frontières dessinées sont celles fixées par l&apos;IAU en 1930
          (E. Delporte), tracées d&apos;après la position des étoiles. Elles ne
          forment pas douze cases égales : le Soleil reste 45 jours dans la
          Vierge, 19 dans Ophiuchus, et seulement 6 dans le Scorpion. C&apos;est
          cette géométrie réelle que le calendrier astrologique a lissée en
          douze parts de 30°.
        </p>
      </div>
    </Section>
  );
}

// ─── Deux mouvements de la Terre : Soleil vs Ascendant ──────────────────────

export function TwoMotionsCard() {
  return (
    <Section label="DEUX MOUVEMENTS, DEUX SIGNES">
      <div className="px-3 py-2.5 font-sans text-cockpit-xl leading-relaxed text-slate-300 space-y-2">
        <p>
          Ton <span className="text-yellow-300 font-medium">signe solaire</span>{' '}
          dépend de la position du Soleil dans le zodiaque. Le Soleil met{' '}
          <strong className="text-violet-100 font-medium">~365 jours</strong> à
          parcourir l&apos;écliptique ; le calendrier astrologique la découpe en{' '}
          <strong className="text-violet-100 font-medium">12 secteurs de 30°</strong>,
          soit environ 30 jours chacun. C&apos;est pour ça qu&apos;une simple
          date suffit à le déterminer.
        </p>
        <p>
          Ton <span className="text-emerald-300 font-medium">ascendant</span>, lui, est
          le signe qui pointait juste au-dessus de l&apos;horizon est à
          l&apos;instant précis de ta naissance. Or la Terre fait un tour
          sur elle-même en <strong className="text-violet-100 font-medium">24&nbsp;h</strong>{' '}
          : les 360° du zodiaque défilent à l&apos;horizon en une journée, soit
          un nouveau signe toutes les{' '}
          <strong className="text-violet-100 font-medium">~2&nbsp;h</strong>.
        </p>
        <p className="text-slate-400">
          D&apos;où la dissymétrie : la <strong className="text-slate-200 font-medium">révolution
          annuelle</strong> de la Terre autour du Soleil règle le signe
          solaire ; sa <strong className="text-slate-200 font-medium">rotation
          quotidienne</strong> règle l&apos;ascendant. C&apos;est aussi pour ça
          qu&apos;il faut le <em>lieu</em> : l&apos;horizon est dépend de la
          latitude et de la longitude.
        </p>
      </div>
    </Section>
  );
}

// ─── Tableau des positions ───────────────────────────────────────────────────

export function PlanetTable({ reading }: { reading: CelestialReading }) {
  return (
    <Section label="POSITIONS DES PLANÈTES · MAISONS">
      <table className="w-full text-cockpit-sm">
        <thead>
          <tr className="border-b border-border-hud-muted text-cockpit-md tracking-cockpit text-violet-400">
            <th className="px-3 py-1.5 text-left font-normal">ASTRE</th>
            <th className="px-2 py-1.5 text-left font-normal">CONSTELLATION</th>
            <th className="px-2 py-1.5 text-right font-normal">DEG</th>
            <th className="px-3 py-1.5 text-right font-normal">MAISON</th>
          </tr>
        </thead>
        <tbody>
          {reading.bodies.map(body => (
            <PlanetRow key={body.id} body={body} reading={reading} />
          ))}
        </tbody>
      </table>
      <div className="px-3 py-1.5 border-t border-border-hud-faint
                      text-cockpit-md text-slate-500 italic">
        Maisons égales (approx.)
      </div>
    </Section>
  );
}

function PlanetRow({ body, reading }: { body: CelestialBody; reading: CelestialReading }) {
  const lore  = CONSTELLATION_LORE[body.constellation];
  const deg   = degWithinConst(body.eclipticLongitude, reading.julianDay);
  const house = houseNumber(body.eclipticLongitude, reading.ascendantLongitude);

  return (
    <tr className="border-b border-border-hud-hairline hover:bg-violet-500/8 transition-colors">
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span style={{ color: body.color }}
                className="text-cockpit-xl leading-none w-4 text-center shrink-0">
            {body.glyph}
          </span>
          <span className="text-slate-200">{body.name}</span>
        </div>
      </td>
      <td className="px-2 py-1.5 text-violet-300 italic">{lore.latin}</td>
      <td className="px-2 py-1.5 text-right text-slate-400 font-mono">{deg}°</td>
      <td className="px-3 py-1.5 text-right text-amber-400 font-mono">{house}</td>
    </tr>
  );
}

// ─── Données célestes ────────────────────────────────────────────────────────

export function AstroInfoCard({ reading }: { reading: CelestialReading }) {
  const lst = reading.localSiderealTime;
  const h   = Math.floor(lst);
  const m   = Math.floor((lst - h) * 60);
  const lstStr = `${h}h ${m.toString().padStart(2, '0')}m`;

  return (
    <Section label="DONNÉES ASTRONOMIQUES BRUTES">
      <div className="px-3 py-2.5 space-y-1.5 font-mono text-cockpit-sm">
        <InfoRow label="Heure sidérale locale" value={lstStr} />
        <InfoRow label="Jour julien" value={reading.julianDay.toFixed(3)} />
        <InfoRow label="Obliquité de l'écliptique" value={`${reading.obliquity.toFixed(2)}°`} />
        <InfoRow label="Décalage précession" value={`~${Math.round(reading.precessionGapDays)} j`} />
      </div>
    </Section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 shrink-0">{value}</span>
    </div>
  );
}

// ─── Soleil : ciel réel et calendrier tropical ────────────────────────────────

export function NotesCard({ reading }: { reading: CelestialReading }) {
  const sunLore      = CONSTELLATION_LORE[reading.trueConstellation];
  const tropicalLore = reading.tropicalSign !== reading.trueConstellation
    ? CONSTELLATION_LORE[reading.tropicalSign]
    : null;
  const gapDays = Math.round(reading.precessionGapDays);

  return (
    <Section label="TON SIGNE : ASTROLOGIQUE vs ASTRONOMIQUE">
      <div className="px-3 py-2.5 font-sans text-cockpit-xl leading-relaxed space-y-2 text-slate-300">
        {tropicalLore ? (
          <>
            <p>
              Le calendrier astrologique te place sous le signe{' '}
              <span className="text-slate-200 font-medium">{tropicalLore.fr}</span> —
              une case de 30° découpée à partir du point vernal il y a 2&nbsp;000 ans.
            </p>
            <p>
              À cette même date, le Soleil se trouvait en réalité dans la
              constellation{' '}
              <span className="text-yellow-300 font-medium">{sunLore.fr}</span> :
              c&apos;est ton vrai signe astronomique. La précession des
              équinoxes a fait dériver le ciel d&apos;environ {gapDays}&nbsp;jours
              par rapport à l&apos;origine historique du zodiaque.
            </p>
          </>
        ) : (
          <p>
            Pour cette date, le secteur du calendrier astrologique et la
            constellation IAU du Soleil coïncident — un cas rare. Ailleurs sur
            l&apos;écliptique, la précession les sépare presque toujours d&apos;un
            signe entier.
          </p>
        )}
        <p className="text-slate-400">
          Le calcul s&apos;appuie sur l&apos;astronomie de position : éphémérides
          de Meeus, frontières IAU/Delporte, repère ICRS&nbsp;J2000. Aucune
          interprétation symbolique — juste où étaient les astres.
        </p>
        <p className="text-slate-500 italic leading-relaxed pt-1 border-t border-border-hud-faint">
          {sunLore.poetic}
        </p>
      </div>
    </Section>
  );
}

// ─── Pied de page ────────────────────────────────────────────────────────────

export function ScientificFooter() {
  return (
    <footer className="pt-2 text-cockpit-xs tracking-wider text-slate-600 font-mono space-y-0.5">
      <div>ICRS J2000 · MEEUS 1998 · DELPORTE 1930</div>
    </footer>
  );
}

// ─── Section réutilisable ─────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border-hud-subtle rounded-panel overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border-hud-muted bg-violet-900/25
                      text-cockpit-md tracking-cockpit-caps text-violet-300">
        {label}
      </div>
      {children}
    </div>
  );
}
