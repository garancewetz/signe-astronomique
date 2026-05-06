import {
  formatRA,
  getIauBoundaries,
  precessionOffset,
  type CelestialBody,
  type CelestialReading,
} from '../utils/astroEngine';
import { CONSTELLATION_LORE } from '../utils/constellationLore';

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

function getTimeOfDay(utcHour: number): string {
  if (utcHour >= 6 && utcHour < 12) return 'matin';
  if (utcHour >= 12 && utcHour < 18) return 'après-midi';
  if (utcHour >= 18) return 'soirée';
  return 'nuit';
}

// ─── En-tête naissance ───────────────────────────────────────────────────────

export function BirthHeader({ reading }: { reading: CelestialReading }) {
  const { date, placeLabel, latitude, longitude } = reading.input;
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = date.toISOString().slice(11, 16) + ' UTC';

  return (
    <div className="pb-3 border-b border-violet-400/20">
      <div className="text-[9px] tracking-[0.35em] text-violet-400 mb-1.5">
        THÈME ASTRAL · CIEL RÉEL À LA NAISSANCE
      </div>
      <div className="text-white text-[13px] leading-snug font-medium">
        {dateStr} à {timeStr}
      </div>
      {placeLabel && (
        <div className="text-slate-400 text-[10px] mt-0.5 font-mono">
          {placeLabel}&nbsp;
          ({latitude >= 0 ? latitude.toFixed(2) + '° N' : Math.abs(latitude).toFixed(2) + '° S'},&nbsp;
          {longitude >= 0 ? longitude.toFixed(2) + '° E' : Math.abs(longitude).toFixed(2) + '° O'})
        </div>
      )}
    </div>
  );
}

// ─── Résumé : ciel en un coup d'œil ─────────────────────────────────────────

export function ResumeCard({ reading }: { reading: CelestialReading }) {
  const sunLore = CONSTELLATION_LORE[reading.trueConstellation];
  const moonLore = CONSTELLATION_LORE[reading.moon.constellation];
  const ascLore  = CONSTELLATION_LORE[reading.ascendantConstellation];
  const season   = getSeason(reading.sunEclipticLongitude, reading.input.latitude);
  const timeDay  = getTimeOfDay(reading.input.date.getUTCHours());

  return (
    <Section label="TON CIEL EN UN COUP D’ŒIL">
      <div className="px-3 py-2.5 space-y-2">
        <ResumeRow glyph="☉" glyphColor="#fde68a" label="Vrai signe (Soleil)"
          value={sunLore.fr} valueClass="text-yellow-300" />
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

function ResumeRow({ glyph, glyphColor, label, value, valueClass }: {
  glyph: string; glyphColor: string;
  label: string; value: string; valueClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: glyphColor }}
            className="w-4 text-center shrink-0 text-sm leading-none">
        {glyph}
      </span>
      <span className="text-slate-400 shrink-0 w-36 text-[10px]">{label}</span>
      <span className={`font-medium text-[10.5px] ${valueClass}`}>{value}</span>
    </div>
  );
}

// ─── Ascendant ───────────────────────────────────────────────────────────────

export function AscendantCard({ reading }: { reading: CelestialReading }) {
  const lore = CONSTELLATION_LORE[reading.ascendantConstellation];
  return (
    <div className="border border-emerald-500/30 bg-emerald-900/15 rounded-sm p-3">
      <div className="text-[8.5px] tracking-[0.3em] text-emerald-400 mb-2">
        ↑ ASCENDANT · HORIZON EST
      </div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-emerald-300 text-sm font-medium">{lore.fr}</span>
        <span className="text-[9px] text-emerald-400/70 font-mono italic">{lore.latin}</span>
      </div>
      <div className="text-[9px] text-emerald-400/60 grid grid-cols-2 gap-x-3 font-mono mt-1.5">
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
      <div className="px-3 py-2.5 text-[10px] leading-relaxed text-slate-300 space-y-1.5">
        <p>
          Ce que tu vois est le <strong className="text-violet-100 font-medium">ciel
          réel</strong> tel qu&apos;il était au-dessus du lieu, à la date et à
          l&apos;heure de ta naissance — pas un schéma symbolique.
        </p>
        <p className="text-[9.5px] text-slate-400">
          Active les guides <span className="text-amber-300">⊕</span> dans la
          console pour voir l&apos;axe terrestre (autour duquel la Terre tourne),
          l&apos;équateur céleste (sa projection sur le ciel) et
          l&apos;écliptique — le chemin apparent du Soleil sur l&apos;année. Les
          treize constellations zodiacales sont celles que ce chemin traverse.
        </p>
        <p className="text-[9.5px] text-slate-500">
          Les frontières dessinées sont celles de l&apos;IAU (1930), tracées
          d&apos;après les positions des étoiles. Elles ne forment pas douze
          cases égales : le Soleil reste 45 jours dans la Vierge, 6 dans le
          Scorpion, 18 dans Ophiuchus. C&apos;est cette géométrie réelle que
          le calendrier astrologique a lissée en douze parts de 30°.
        </p>
      </div>
    </Section>
  );
}

// ─── Tableau des positions ───────────────────────────────────────────────────

export function PlanetTable({ reading }: { reading: CelestialReading }) {
  return (
    <Section label="POSITIONS DES PLANÈTES · MAISONS">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="border-b border-violet-400/15 text-[8.5px] tracking-[0.2em] text-violet-400">
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
      <div className="px-3 py-1.5 border-t border-violet-400/10
                      text-[8.5px] text-slate-500 italic">
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
    <tr className="border-b border-violet-400/8 hover:bg-violet-500/8 transition-colors">
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span style={{ color: body.color }}
                className="text-[13px] leading-none w-4 text-center shrink-0">
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
      <div className="px-3 py-2.5 space-y-1.5 font-mono text-[10px]">
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
      <div className="px-3 py-2.5 text-[10px] leading-relaxed space-y-2 text-slate-300">
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
        <p className="text-[9.5px] text-slate-400">
          Le calcul s&apos;appuie sur l&apos;astronomie de position : éphémérides
          de Meeus, frontières IAU/Delporte, repère ICRS&nbsp;J2000. Aucune
          interprétation symbolique — juste où étaient les astres.
        </p>
        <p className="text-slate-500 text-[9.5px] italic leading-relaxed pt-1 border-t border-violet-400/10">
          {sunLore.poetic}
        </p>
      </div>
    </Section>
  );
}

// ─── Pied de page ────────────────────────────────────────────────────────────

export function ScientificFooter() {
  return (
    <footer className="pt-2 text-[8px] tracking-wider text-slate-600 font-mono space-y-0.5">
      <div>ICRS J2000 · MEEUS 1998 · DELPORTE 1930</div>
    </footer>
  );
}

// ─── Section réutilisable ─────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-violet-400/20 rounded-sm overflow-hidden">
      <div className="px-3 py-1.5 border-b border-violet-400/15 bg-violet-900/25
                      text-[8.5px] tracking-[0.3em] text-violet-300">
        {label}
      </div>
      {children}
    </div>
  );
}
