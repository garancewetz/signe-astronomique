import {
  CONSTELLATION_LORE,
  PLANETS_META,
  formatRA,
  getIauBoundaries,
  loreName,
  lorePoetic,
  precessionOffset,
  type CelestialBody,
  type CelestialReading,
  type PlanetId,
} from '@/features/astronomy';
import { useLocale, useT } from '@/context/useLocale';
import { cn } from '@/ui/cn';

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

type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

function getSeasonKey(sunTropLon: number, lat: number): SeasonKey {
  const isNorth = lat >= 0;
  const idx = Math.floor(norm360(sunTropLon) / 90);
  const north: SeasonKey[] = ['spring', 'summer', 'autumn', 'winter'];
  const south: SeasonKey[] = ['autumn', 'winter', 'spring', 'summer'];
  return (isNorth ? north : south)[idx];
}

type TimeOfDayKey = 'morning' | 'afternoon' | 'evening' | 'night';

function getTimeOfDayKey(localHour: number): TimeOfDayKey {
  if (localHour >= 6 && localHour < 12) return 'morning';
  if (localHour >= 12 && localHour < 18) return 'afternoon';
  if (localHour >= 18) return 'evening';
  return 'night';
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

function planetDisplayName(id: PlanetId, locale: 'fr' | 'en'): string {
  const m = PLANETS_META[id];
  return locale === 'en' ? m.en : m.fr;
}

function bodyDisplayName(
  body: CelestialBody,
  locale: 'fr' | 'en',
  t: { bodies: { sun: string; moon: string } },
): string {
  if (body.id === 'sun') return t.bodies.sun;
  if (body.id === 'moon') return t.bodies.moon;
  return planetDisplayName(body.id, locale);
}

// ─── Birth header ────────────────────────────────────────────────────────────

export function BirthHeader({ reading }: { reading: CelestialReading }) {
  const t = useT();
  const { locale } = useLocale();
  const { date, placeLabel, latitude, longitude, timezone } = reading.input;
  const dateFmt = new Intl.DateTimeFormat(t.intlLocale, {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: timezone ?? 'UTC',
  });
  const timeFmt = new Intl.DateTimeFormat(t.intlLocale, {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: timezone ?? 'UTC',
  });
  const dateStr = dateFmt.format(date);
  const timeStr = timezone ? timeFmt.format(date) : `${timeFmt.format(date)} UTC`;
  const at = locale === 'en' ? ' at ' : ' à ';

  return (
    <div className="pb-3 border-b border-border-hud-subtle">
      <div className="text-cockpit-sm tracking-cockpit-hud text-violet-400 mb-1.5">
        {t.birthHeader.eyebrow}
      </div>
      <div className="text-white text-cockpit-xl leading-snug font-medium">
        {dateStr}{at}{timeStr}
      </div>
      {placeLabel && (
        <div className="text-slate-400 text-cockpit-sm mt-0.5 font-mono">
          {placeLabel}&nbsp;
          ({latitude >= 0
            ? `${latitude.toFixed(2)}° ${t.birthHeader.north}`
            : `${Math.abs(latitude).toFixed(2)}° ${t.birthHeader.south}`},&nbsp;
          {longitude >= 0
            ? `${longitude.toFixed(2)}° ${t.birthHeader.east}`
            : `${Math.abs(longitude).toFixed(2)}° ${t.birthHeader.west}`})
        </div>
      )}
    </div>
  );
}

// ─── Summary: sky at a glance ───────────────────────────────────────────────

export function ResumeCard({
  reading,
  onRevealConstellation,
}: {
  reading: CelestialReading;
  /** When set, the Sun row becomes a CTA that flies the camera to the
   *  user's constellation in the 3D sky. */
  onRevealConstellation?: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const sunName = loreName(reading.trueConstellation, locale);
  const moonName = loreName(reading.moon.constellation, locale);
  const ascName  = loreName(reading.ascendantConstellation, locale);
  const seasonKey = getSeasonKey(reading.sunEclipticLongitude, reading.input.latitude);
  const timeKey  = getTimeOfDayKey(localHourIn(reading.input.date, reading.input.timezone));

  return (
    <Section label={t.resumeCard.sectionLabel}>
      <div className="px-3 py-2.5 space-y-2">
        <ResumeRow glyph="☉" glyphColor="#fde68a" label={t.resumeCard.rows.trueSign}
          value={sunName} valueClass="text-yellow-300"
          onReveal={onRevealConstellation}
          revealAriaLabel={t.resumeCard.revealAriaLabel}
          revealTooltip={t.resumeCard.revealTooltip} />
        <ResumeRow glyph="☽" glyphColor="#c4b5fd" label={t.resumeCard.rows.moon}
          value={`${moonName} · ${t.moonPhases[reading.moon.phaseKey]}`} valueClass="text-violet-200" />
        <ResumeRow glyph="↑" glyphColor="#4ade80" label={t.resumeCard.rows.ascendant}
          value={ascName} valueClass="text-emerald-300" />
        <ResumeRow glyph="◆" glyphColor="#fbbf24" label={t.resumeCard.rows.seasonMoment}
          value={`${t.seasons[seasonKey]} · ${t.timeOfDay[timeKey]}`} valueClass="text-amber-300" />
      </div>
    </Section>
  );
}

function ResumeRow({ glyph, glyphColor, label, value, valueClass, onReveal, revealAriaLabel, revealTooltip }: {
  glyph: string; glyphColor: string;
  label: string; value: string; valueClass: string;
  onReveal?: () => void;
  revealAriaLabel?: string;
  revealTooltip?: string;
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
          aria-label={revealAriaLabel}
          title={revealTooltip}
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
  const t = useT();
  const { locale } = useLocale();
  const name = loreName(reading.ascendantConstellation, locale);
  const lore = CONSTELLATION_LORE[reading.ascendantConstellation];
  return (
    <div className="border border-emerald-500/30 bg-emerald-900/15 rounded-sm p-3">
      <div className="text-cockpit-md tracking-cockpit-caps text-emerald-400 mb-2">
        {t.ascendantCard.sectionLabel}
      </div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-emerald-300 text-sm font-medium">{name}</span>
        <span className="text-cockpit-sm text-emerald-400/70 font-mono italic">{lore.latin}</span>
      </div>
      <div className="text-cockpit-sm text-emerald-400/60 grid grid-cols-2 gap-x-3 font-mono mt-1.5">
        <span>{t.ascendantCard.lstLabel} {formatRA(reading.localSiderealTime)}</span>
        <span>φ {reading.input.latitude.toFixed(2)}°</span>
      </div>
    </div>
  );
}

// ─── How to read ─────────────────────────────────────────────────────────────

export function HowToRead() {
  const t = useT();
  // The intro string carries `**emphasis**` markers — render them inline.
  const [introBefore, introEmphasis, introAfter] = splitEmphasis(t.howToRead.intro);
  return (
    <Section label={t.howToRead.sectionLabel}>
      <div className="px-3 py-2.5 font-sans text-cockpit-xl leading-relaxed text-slate-300 space-y-2">
        <p>
          {introBefore}
          {introEmphasis && (
            <strong className="text-violet-100 font-medium">{introEmphasis}</strong>
          )}
          {introAfter}
        </p>
        <p className="text-slate-400">
          {t.howToRead.layersHintPrefix}
          <span className="text-amber-300">{t.howToRead.layersHintEmphasis}</span>
          {t.howToRead.layersHintSuffix}
        </p>
        <p className="text-slate-500">
          {t.howToRead.boundaries}
        </p>
      </div>
    </Section>
  );
}

function splitEmphasis(s: string): [string, string | null, string] {
  const match = /^([^*]*)\*\*([^*]+)\*\*([\s\S]*)$/.exec(s);
  if (!match) return [s, null, ''];
  return [match[1], match[2], match[3]];
}

// ─── Two motions ─────────────────────────────────────────────────────────────

export function TwoMotionsCard() {
  const t = useT();
  const { solar, ascendant, summary } = t.twoMotions;
  return (
    <Section label={t.twoMotions.sectionLabel}>
      <div className="px-3 py-2.5 font-sans text-cockpit-xl leading-relaxed text-slate-300 space-y-2">
        <p>
          {solar.lead}
          <span className="text-yellow-300 font-medium">{solar.leadEmphasis}</span>
          {solar.mid}
          <strong className="text-violet-100 font-medium">{solar.midEmphasis}</strong>
          {solar.mid2}
          <strong className="text-violet-100 font-medium">{solar.mid2Emphasis}</strong>
          {solar.tail}
        </p>
        <p>
          {ascendant.lead}
          <span className="text-emerald-300 font-medium">{ascendant.leadEmphasis}</span>
          {ascendant.mid}
          <strong className="text-violet-100 font-medium">{ascendant.midEmphasis}</strong>
          {ascendant.mid2}
          <strong className="text-violet-100 font-medium">{ascendant.mid2Emphasis}</strong>
          {ascendant.tail}
        </p>
        <p className="text-slate-400">
          {summary.lead}
          <strong className="text-slate-200 font-medium">{summary.leadEmphasis}</strong>
          {summary.mid}
          <strong className="text-slate-200 font-medium">{summary.midEmphasis}</strong>
          {summary.tail}
        </p>
      </div>
    </Section>
  );
}

// ─── Planetary positions ─────────────────────────────────────────────────────

export function PlanetTable({ reading }: { reading: CelestialReading }) {
  const t = useT();
  return (
    <Section label={t.planetTable.sectionLabel}>
      <table className="w-full text-cockpit-sm">
        <thead>
          <tr className="border-b border-border-hud-muted text-cockpit-md tracking-cockpit text-violet-400">
            <th className="px-3 py-1.5 text-left font-normal">{t.planetTable.columns.body}</th>
            <th className="px-2 py-1.5 text-left font-normal">{t.planetTable.columns.constellation}</th>
            <th className="px-2 py-1.5 text-right font-normal">{t.planetTable.columns.degree}</th>
            <th className="px-3 py-1.5 text-right font-normal">{t.planetTable.columns.house}</th>
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
        {t.planetTable.footnote}
      </div>
    </Section>
  );
}

function PlanetRow({ body, reading }: { body: CelestialBody; reading: CelestialReading }) {
  const t = useT();
  const { locale } = useLocale();
  const lore  = CONSTELLATION_LORE[body.constellation];
  const deg   = degWithinConst(body.eclipticLongitude, reading.julianDay);
  const house = houseNumber(body.eclipticLongitude, reading.ascendantLongitude);
  const name = bodyDisplayName(body, locale, t);

  return (
    <tr className="border-b border-border-hud-hairline hover:bg-violet-500/8 transition-colors">
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span style={{ color: body.color }}
                className="text-cockpit-xl leading-none w-4 text-center shrink-0">
            {body.glyph}
          </span>
          <span className="text-slate-200">{name}</span>
        </div>
      </td>
      <td className="px-2 py-1.5 text-violet-300 italic">{lore.latin}</td>
      <td className="px-2 py-1.5 text-right text-slate-400 font-mono">{deg}°</td>
      <td className="px-3 py-1.5 text-right text-amber-400 font-mono">{house}</td>
    </tr>
  );
}

// ─── Raw astronomical data ───────────────────────────────────────────────────

export function AstroInfoCard({ reading }: { reading: CelestialReading }) {
  const t = useT();
  const lst = reading.localSiderealTime;
  const h   = Math.floor(lst);
  const m   = Math.floor((lst - h) * 60);
  const lstStr = `${h}h ${m.toString().padStart(2, '0')}m`;

  return (
    <Section label={t.astroInfoCard.sectionLabel}>
      <div className="px-3 py-2.5 space-y-1.5 font-mono text-cockpit-sm">
        <InfoRow label={t.astroInfoCard.rows.lst} value={lstStr} />
        <InfoRow label={t.astroInfoCard.rows.julianDay} value={reading.julianDay.toFixed(3)} />
        <InfoRow label={t.astroInfoCard.rows.obliquity} value={`${reading.obliquity.toFixed(2)}°`} />
        <InfoRow
          label={t.astroInfoCard.rows.precessionGap}
          value={`~${Math.round(reading.precessionGapDays)} ${t.astroInfoCard.daysUnit}`}
        />
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

// ─── Notes: astrological vs astronomical ─────────────────────────────────────

export function NotesCard({ reading }: { reading: CelestialReading }) {
  const t = useT();
  const { locale } = useLocale();
  const sunName = loreName(reading.trueConstellation, locale);
  const tropicalName = reading.tropicalSign !== reading.trueConstellation
    ? loreName(reading.tropicalSign, locale)
    : null;
  const gapDays = Math.round(reading.precessionGapDays);
  const sunPoetic = lorePoetic(reading.trueConstellation, locale);

  return (
    <Section label={t.notesCard.sectionLabel}>
      <div className="px-3 py-2.5 font-sans text-cockpit-xl leading-relaxed space-y-2 text-slate-300">
        {tropicalName ? (
          <>
            <p>
              {t.notesCard.tropicalIntroLead}
              <span className="text-slate-200 font-medium">{tropicalName}</span>
              {t.notesCard.tropicalIntroTail}
            </p>
            <p>
              {t.notesCard.realityLead}
              <span className="text-yellow-300 font-medium">{sunName}</span>
              {t.notesCard.realityMid}
              {gapDays}
              {t.notesCard.realityTail}
            </p>
          </>
        ) : (
          <p>{t.notesCard.matchedCase}</p>
        )}
        <p className="text-slate-400">{t.notesCard.method}</p>
        <p className="text-slate-500 italic leading-relaxed pt-1 border-t border-border-hud-faint">
          {sunPoetic}
        </p>
      </div>
    </Section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export function ScientificFooter() {
  const t = useT();
  return (
    <footer className="pt-2 text-cockpit-xs tracking-wider text-slate-600 font-mono space-y-0.5">
      <div>{t.scientificFooter}</div>
    </footer>
  );
}

// ─── Reusable section wrapper ────────────────────────────────────────────────

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
