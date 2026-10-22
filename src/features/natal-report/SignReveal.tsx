import { Fragment, type ReactNode } from 'react';
import { Check, Clock, Link2 } from 'lucide-react';
import {
  loreName,
  loreShortName,
  natalPlacements,
  nearestBoundary,
  PLANETS_META,
  type CelestialReading,
  type IauConstellation,
  type NatalPlacement,
} from '@/features/astronomy';
import { Button, cn } from '@/ui';
import { useT } from '@/context/useLocale';

// U+FE0E asks for the text (not emoji) presentation of each glyph.
const SIGN_GLYPH: Record<IauConstellation, string> = {
  Aries: '♈︎', Taurus: '♉︎', Gemini: '♊︎', Cancer: '♋︎',
  Leo: '♌︎', Virgo: '♍︎', Libra: '♎︎', Scorpio: '♏︎',
  Ophiuchus: '⛎︎', Sagittarius: '♐︎', Capricorn: '♑︎',
  Aquarius: '♒︎', Pisces: '♓︎',
};

interface SignRevealProps {
  reading: CelestialReading;
  /** Set when the sky is on screen: shows the hint about its gold band. */
  onRevealConstellation?: () => void;
  /** When set, an unknown birth time offers to add it (for the ascendant). */
  onAddBirthTime?: () => void;
  /** When set, shows a share link next to the CTA. */
  onShare?: () => void;
  shareCopied?: boolean;
  /** Shows the link to the static /signes/ page (off in the PDF export). */
  showAllSignsLink?: boolean;
  /** False when the time was left out (computed at noon). */
  birthTimeKnown?: boolean;
}

/** Births closer than this to a boundary get the "on the edge" note. */
const EDGE_DAYS = 3;

/**
 * The result, laid out like a page of an almanac rather than a card: the
 * true sign set large, then the whole chart (Sun, Moon, Ascendant, planets)
 * as a two-column table — what the horoscope says, what the sky shows —
 * and only then the why.
 */
export function SignReveal({
  reading, onRevealConstellation, onAddBirthTime, onShare, shareCopied = false,
  showAllSignsLink = false, birthTimeKnown = true,
}: SignRevealProps) {
  const t = useT();
  const trueSign = reading.trueConstellation;
  const horoscopeSign = reading.tropicalSign;
  const same = trueSign === horoscopeSign;
  const trueName = loreName(trueSign);
  const horoscopeName = loreName(horoscopeSign);
  const edge = nearestBoundary(reading.sunSiderealLongitude);
  const onEdge = edge.days < EDGE_DAYS;
  // The ascendant needs both the time and the place: without a place, the
  // form falls back to the visitor's position, which says nothing about
  // where they were born.
  const ascendantKnown = birthTimeKnown && !!reading.input.placeLabel;
  const ascendantOffset =
    (((reading.ascendantLongitude - reading.sunEclipticLongitude) % 360) + 360) % 360;

  const timeZone = reading.input.timezone ?? 'UTC';
  const birthDay = new Intl.DateTimeFormat(t.intlLocale, {
    day: 'numeric', month: 'long', timeZone,
  }).format(reading.input.date);
  const birthLine = [
    new Intl.DateTimeFormat(t.intlLocale, {
      day: 'numeric', month: 'long', year: 'numeric', timeZone,
    }).format(reading.input.date),
    birthTimeKnown
      ? new Intl.DateTimeFormat(t.intlLocale, {
          hour: '2-digit', minute: '2-digit', timeZone,
        }).format(reading.input.date)
      : t.signReveal.timeUnknown,
    reading.input.placeLabel,
  ].filter(Boolean).join(' · ');

  return (
    <article className="text-slate-300">
      <header className="pb-6 border-b border-border-hud-subtle">
        <p className="font-mono text-cockpit-md text-slate-400">{birthLine}</p>
        <p className="mt-5 text-cockpit-lg text-slate-400">{t.signReveal.trueSignLabel}</p>
        <h3 className="mt-1 flex items-baseline gap-3 font-serif text-5xl font-medium
                       leading-none tracking-tight text-amber-200">
          <span className="text-balance">{trueName}</span>
          <span aria-hidden="true" className="text-3xl text-amber-200/70">{SIGN_GLYPH[trueSign]}</span>
        </h3>
        <p className="mt-3 text-cockpit-xl text-slate-200">
          {same ? t.signReveal.sameAsHoroscope : t.signReveal.notHoroscope(horoscopeName)}
        </p>
        {onEdge && (
          <p className="mt-4 pl-3 border-l-2 border-amber-200/50 text-cockpit-lg leading-relaxed text-slate-300">
            <Rich
              text={(edge.side === 'leaving' ? t.signReveal.edgeLeaving : t.signReveal.edgeEntered)(
                t.signReveal.edgeDays(Math.round(edge.days)),
                loreShortName(edge.neighbour),
              )}
            />
            {!birthTimeKnown && <> {t.signReveal.edgeAddTime}</>}
          </p>
        )}
      </header>

      <section className="py-6 border-b border-border-hud-subtle space-y-3 text-cockpit-xl leading-relaxed">
        <SectionTitle>{t.signReveal.whatTitle}</SectionTitle>
        <SkyAlignment
          sign={trueSign}
          ascendant={ascendantKnown
            ? { sign: reading.ascendantConstellation, offset: ascendantOffset }
            : undefined}
        />
        {ascendantKnown && (
          <p className="-mt-1 flex items-baseline gap-2 font-mono text-cockpit-md text-slate-400">
            <span aria-hidden="true" className="inline-block w-4 h-px shrink-0 translate-y-[-3px] bg-[#9fb4e8]" />
            <span>
              <Rich text={t.signReveal.horizonLegend(loreShortName(reading.ascendantConstellation))} />
            </span>
          </p>
        )}
        <p><Rich text={t.signReveal.alignmentBody(trueName)} /></p>
        <p>
          <Rich
            text={same
              ? t.signReveal.sameBody(birthDay, trueName)
              : t.signReveal.differBody(birthDay, horoscopeName, trueName)}
          />
        </p>
        {trueSign === 'Ophiuchus' && (
          <p><Rich text={t.signReveal.ophiuchus} /></p>
        )}
        {ascendantKnown ? (
          <p>
            <Rich
              text={`${t.signReveal.ascendantBody(loreShortName(reading.ascendantConstellation))} ${t.signReveal.sunAtBirth[sunPhase(ascendantOffset)]}`}
            />
          </p>
        ) : (
          <div className="space-y-2">
            <p>{birthTimeKnown ? t.signReveal.ascendantNeedsPlace : t.signReveal.ascendantNeedsTime}</p>
            {onAddBirthTime && (
              <Button
                variant="outline"
                size="md"
                onClick={onAddBirthTime}
                className="tracking-normal text-cockpit-lg"
              >
                <Clock className="size-3.5" strokeWidth={1.6} aria-hidden />
                {birthTimeKnown ? t.signReveal.addBirthPlace : t.signReveal.addBirthTime}
              </Button>
            )}
          </div>
        )}
        {onRevealConstellation && (
          <p className="text-cockpit-lg text-slate-400">{t.signReveal.skyBandHint}</p>
        )}
      </section>

      {/* Only when Ophiuchus is in the reader's own chart: their sign or,
          with a known birth time, their ascendant. */}
      {trueSign === 'Ophiuchus'
        || (ascendantKnown && reading.ascendantConstellation === 'Ophiuchus') ? (
        <section className="py-6 border-b border-border-hud-subtle">
          <div className="pl-4 border-l-2 border-border-hud-strong space-y-3
                          text-cockpit-lg leading-relaxed text-slate-300">
            <h3 className="font-serif text-lg font-medium leading-snug text-white">
              {t.signReveal.ophiuchusWhy.title}
            </h3>
            {t.signReveal.ophiuchusWhy.paragraphs.map((text) => (
              <p key={text}><Rich text={text} /></p>
            ))}
            <p>
              <strong className="font-medium text-white">{t.signReveal.ophiuchusWhy.scienceTitle}</strong>{' '}
              <Rich text={t.signReveal.ophiuchusWhy.science} />
            </p>
          </div>
        </section>
      ) : null}

      <section className="py-6">
        <SectionTitle>{t.signReveal.chartTitle}</SectionTitle>
        <p className="mt-2 text-cockpit-lg leading-relaxed text-slate-400">
          {t.signReveal.chartIntro}
        </p>
        <ChartTable
          reading={reading}
          birthTimeKnown={birthTimeKnown}
          ascendantKnown={ascendantKnown}
          onAddBirthTime={onAddBirthTime}
        />
        <dl className="mt-4 space-y-1.5 text-cockpit-md leading-relaxed text-slate-400">
          {t.signReveal.chartNotes.map(({ term, text }) => (
            <div key={term}>
              <dt className="inline text-slate-200">{term} : </dt>
              <dd className="inline">{text}</dd>
            </div>
          ))}
        </dl>
        {!birthTimeKnown && (
          <p className="mt-1.5 text-cockpit-md leading-relaxed text-slate-400">{t.signReveal.moonNeedsTime}</p>
        )}
      </section>

      <p className="pb-5 text-cockpit-md leading-relaxed text-slate-500">
        {t.signReveal.method}{' '}
        <a
          href="/signes/#method-title"
          className="cockpit-focus rounded text-slate-300 underline decoration-slate-500 underline-offset-4
                     hover:decoration-slate-200"
        >
          {t.signReveal.methodLink}
        </a>
      </p>

      {(onShare || showAllSignsLink) && (
        <div className="pt-5 border-t border-border-hud-subtle">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-cockpit-lg">
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="cockpit-focus inline-flex items-center gap-1.5 min-h-8 rounded
                           text-slate-200 underline decoration-slate-500 underline-offset-4
                           hover:decoration-slate-200"
              >
                {shareCopied
                  ? <Check className="size-3.5" strokeWidth={1.6} aria-hidden />
                  : <Link2 className="size-3.5" strokeWidth={1.6} aria-hidden />}
                {shareCopied ? t.sidebar.result.shareCopied : t.signReveal.share}
              </button>
            )}
            {showAllSignsLink && (
              <a
                href="/signes/"
                className="cockpit-focus inline-flex items-center min-h-8 rounded
                           text-slate-200 underline decoration-slate-500 underline-offset-4
                           hover:decoration-slate-200"
              >
                {t.signReveal.allSignsLink}
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function ChartTable({
  reading, birthTimeKnown, ascendantKnown, onAddBirthTime,
}: {
  reading: CelestialReading;
  birthTimeKnown: boolean;
  ascendantKnown: boolean;
  onAddBirthTime?: () => void;
}) {
  const t = useT();
  const bodyName = (p: NatalPlacement): string => {
    if (p.id === 'sun') return t.bodies.sun;
    if (p.id === 'moon') return t.bodies.moon;
    if (p.id === 'ascendant') return t.signReveal.ascendant;
    return PLANETS_META[p.id].fr;
  };

  return (
    <table className="mt-4 w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-border-hud-subtle">
          {[t.signReveal.chartCols.body, t.signReveal.chartCols.horoscope, t.signReveal.chartCols.sky]
            .map((col) => (
              <th
                key={col}
                scope="col"
                className="pb-2 pr-2 font-mono text-cockpit-sm font-normal
                           tracking-cockpit-tight text-slate-500"
              >
                {col}
              </th>
            ))}
        </tr>
      </thead>
      <tbody>
        {natalPlacements(reading).map((p) => {
          const unknown = p.id === 'ascendant' && !ascendantKnown;
          const differs = p.horoscope !== p.sky;
          const key = p.id === 'sun' || p.id === 'moon' || p.id === 'ascendant';
          return (
            <tr
              key={p.id}
              className={cn(
                'border-b border-border-hud-faint',
                p.id === 'ascendant' && 'border-b-border-hud-subtle',
              )}
            >
              <th
                scope="row"
                className={cn(
                  'py-2 pr-2 font-normal text-cockpit-lg whitespace-nowrap',
                  key ? 'text-white' : 'text-slate-300',
                )}
              >
                <span aria-hidden="true" className="inline-block w-6 font-mono text-cockpit-md text-slate-500">
                  {p.glyph}
                </span>
                {bodyName(p)}
              </th>
              {unknown ? (
                <td colSpan={2} className="py-2 font-mono text-cockpit-md text-slate-500">
                  {onAddBirthTime ? (
                    <button
                      type="button"
                      onClick={onAddBirthTime}
                      className="cockpit-focus rounded text-slate-300 underline decoration-slate-500
                                 underline-offset-4 hover:decoration-slate-200"
                    >
                      {birthTimeKnown ? t.signReveal.addBirthPlaceShort : t.signReveal.addBirthTimeShort}
                    </button>
                  ) : birthTimeKnown ? t.signReveal.placeUnknown : t.signReveal.timeUnknown}
                </td>
              ) : (
                <>
                  <td
                    className={cn(
                      'py-2 pr-2 font-mono text-cockpit-md',
                      differs ? 'text-slate-500 line-through decoration-slate-500/70' : 'text-slate-400',
                    )}
                  >
                    {loreShortName(p.horoscope)}
                  </td>
                  <td
                    className={cn(
                      'py-2 font-mono text-cockpit-md',
                      p.id === 'sun' ? 'text-amber-200' : 'text-slate-100',
                    )}
                  >
                    {loreShortName(p.sky)}
                  </td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-serif text-xl font-medium leading-snug text-white">
      {children}
    </h3>
  );
}

/**
 * Where the Sun stood against the horizon, from the Sun → Ascendant angle:
 * 0° when it rises, 180° when it sets, above the horizon in between.
 */
function sunPhase(offset: number): 'rising' | 'day' | 'setting' | 'night' {
  if (offset < 12 || offset > 348) return 'rising';
  if (offset < 168) return 'day';
  if (offset <= 192) return 'setting';
  return 'night';
}

/* ── Sky alignment — Earth → Sun → constellation, the definition of a sign ── */

/** Zodiac constellations in the order the Sun crosses them. */
const ZODIAC_ORDER: readonly IauConstellation[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra',
  'Scorpio', 'Ophiuchus', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** Eight short rays around a Sun disc centred on (0, 0). */
const SUN_RAYS = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4;
  const p = (d: number) => `${(d * Math.cos(a)).toFixed(1)} ${(d * Math.sin(a)).toFixed(1)}`;
  return `M ${p(12)} L ${p(16)}`;
}).join(' ');

/** A small generic star pattern drawn around (0, 0). */
const PATTERN: ReadonlyArray<[number, number]> = [
  [-14, -9], [-4, -13], [6, -4], [15, 5], [3, 12],
];

/**
 * Two layouts: the plain Earth → Sun → constellation line, and a roomier
 * one that also leaves space around the Earth for the horizon.
 */
const LAYOUT = {
  plain: { h: 150, y: 80, earth: 32, sun: 128, sign: 256, orbit: 90 },
  horizon: { h: 196, y: 100, earth: 62, sun: 150, sign: 262, orbit: 88 },
} as const;

/** Half-length of the horizon line drawn through the Earth. */
const HORIZON_PX = 46;

const EARTH_STROKE = '#9fb4e8';

interface SkyAlignmentProps {
  sign: IauConstellation;
  /** The ascendant, when the birth time is known. */
  ascendant?: {
    sign: IauConstellation;
    /** Ecliptic angle from the Sun to the eastern horizon, degrees [0..360). */
    offset: number;
  };
}

/**
 * Seen from above the Earth's orbit. The horizon at the birth time cuts
 * this plane along the Ascendant–Descendant line, so it is drawn through
 * the Earth at its real angle from the Sun: along the Sun line at sunrise,
 * square to it around noon or midnight, reversed at sunset. Longitude grows
 * downward here (the next constellation sits under yours), so a positive
 * offset turns the east end clockwise.
 */
function SkyAlignment({ sign, ascendant }: SkyAlignmentProps) {
  const t = useT();
  const L = ascendant ? LAYOUT.horizon : LAYOUT.plain;
  const i = ZODIAC_ORDER.indexOf(sign);
  const prev = ZODIAC_ORDER[(i - 1 + ZODIAC_ORDER.length) % ZODIAC_ORDER.length];
  const next = ZODIAC_ORDER[(i + 1) % ZODIAC_ORDER.length];
  const name = loreShortName(sign);
  const cy = L.y;
  const pts = PATTERN.map(([x, y]) => `${L.sign + x},${cy + y}`).join(' ');

  // Not to scale: the neighbour constellations sit right above and below
  // yours. A sunrise a few degrees off would read as "east points at the
  // neighbour", so near sunrise / sunset the line snaps onto the Sun's.
  const phase = ascendant ? sunPhase(ascendant.offset) : 'rising';
  const drawn = phase === 'rising' ? 0 : phase === 'setting' ? 180 : ascendant?.offset ?? 0;
  const rad = (drawn * Math.PI) / 180;
  const dir = { x: Math.cos(rad), y: Math.sin(rad) };
  const at = (r: number) => ({ x: L.earth + dir.x * r, y: cy + dir.y * r });
  const east = at(HORIZON_PX);
  const west = at(-HORIZON_PX);
  // Labels sit just off the line (perpendicular), so they never ride on the
  // Sun's dashed line when the two overlap at sunrise or sunset.
  const perp = dir.x >= 0 ? { x: dir.y, y: -dir.x } : { x: -dir.y, y: dir.x };
  const offLine = (r: number, d: number) => {
    const p = at(r);
    return { x: p.x + perp.x * d, y: p.y + perp.y * d };
  };
  const eastLabel = offLine(HORIZON_PX - 4, 10);
  const westLabel = offLine(-HORIZON_PX + 4, 10);
  // The Earth's own label goes square to the horizon, on the lower side.
  const below = perp.y > 0 ? 1 : -1;
  const earthLabel = { x: L.earth + perp.x * below * 28, y: cy + perp.y * below * 28 };

  return (
    <svg
      viewBox={`0 0 320 ${L.h}`}
      className="w-full max-w-sm h-auto font-mono"
      role="img"
      aria-label={t.signReveal.alignmentAriaLabel(name)
        + (ascendant ? ` ${t.signReveal.ascendantAriaLabel(loreShortName(ascendant.sign))}` : '')}
    >
      {/* Earth's orbit around the Sun */}
      <ellipse cx={L.sun} cy={cy} rx={L.orbit} ry="30" fill="none"
        className="stroke-slate-500/50" strokeDasharray="3 4" />

      {/* Line of sight: Earth → Sun → constellation */}
      <line x1={L.earth + 14} y1={cy} x2={L.sign - 30} y2={cy}
        className="stroke-amber-200/70" strokeWidth="1.2" strokeDasharray="5 4" />
      <path d={`M ${L.sign - 36} ${cy - 5} L ${L.sign - 28} ${cy} L ${L.sign - 36} ${cy + 5}`}
        fill="none" className="stroke-amber-200/70" strokeWidth="1.2" />

      {/* Neighbour constellations — faded, the Sun is not in front of them */}
      <text x={L.sign} y={cy - 58} textAnchor="middle" className="fill-slate-500 text-[12px]">
        {SIGN_GLYPH[prev]} {loreShortName(prev)}
      </text>
      <text x={L.sign} y={cy + 66} textAnchor="middle" className="fill-slate-500 text-[12px]">
        {SIGN_GLYPH[next]} {loreShortName(next)}
      </text>

      {/* Your constellation */}
      <circle cx={L.sign} cy={cy} r="26" fill="none" className="stroke-amber-300/40" />
      <polyline points={pts} fill="none" className="stroke-amber-200" strokeWidth="1" />
      {PATTERN.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={L.sign + x} cy={cy + y} r="1.8" className="fill-amber-100" />
      ))}
      <text x={L.sign} y={cy + 42} textAnchor="middle" className="fill-amber-200 text-[15px] font-semibold">
        {SIGN_GLYPH[sign]} {name}
      </text>

      {/* Sun — line icons, same as the static pages (emoji differ per OS).
          With the horizon drawn, its label moves above, out of the way. */}
      <circle cx={L.sun} cy={cy} r="9" className="fill-amber-200/85" />
      <path d={SUN_RAYS} transform={`translate(${L.sun} ${cy})`}
        fill="none" className="stroke-amber-200" strokeWidth="1.3" strokeLinecap="round" />
      <text x={L.sun} y={ascendant ? cy - 24 : cy + 32} textAnchor="middle" className="fill-slate-300 text-[12px]">
        {t.signReveal.sun}
      </text>

      {/* Horizon at the birth time — a compass through the Earth */}
      {ascendant && (
        <g>
          <line x1={west.x} y1={west.y} x2={east.x} y2={east.y}
            stroke={EARTH_STROKE} strokeOpacity="0.8" strokeWidth="1.3" />
          <circle cx={east.x} cy={east.y} r="2.2" fill={EARTH_STROKE} />
          <text x={eastLabel.x} y={eastLabel.y + 4} textAnchor="middle"
            fill={EARTH_STROKE} className="text-[12px] font-semibold">
            {t.signReveal.eastShort}
          </text>
          <text x={westLabel.x} y={westLabel.y + 4} textAnchor="middle" className="fill-slate-500 text-[12px]">
            {t.signReveal.westShort}
          </text>
        </g>
      )}

      {/* Earth */}
      <g fill="none" stroke={EARTH_STROKE} strokeWidth="1.2">
        <circle cx={L.earth} cy={cy} r="9" fill="rgb(17 21 30)" />
        <circle cx={L.earth} cy={cy} r="9" fill="rgba(110,140,210,0.18)" />
        <ellipse cx={L.earth} cy={cy} rx="9" ry="3.4" />
        <ellipse cx={L.earth} cy={cy} rx="3.8" ry="9" />
      </g>
      <text
        x={ascendant ? earthLabel.x : L.earth}
        y={(ascendant ? earthLabel.y : cy + 18) + 4}
        textAnchor="middle"
        className="fill-slate-300 text-[12px]"
      >
        {t.signReveal.earth}
      </text>

    </svg>
  );
}

/** Renders `**bold**` markers from copy strings as highlighted text. */
function Rich({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-medium text-white">{p}</strong>
          : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}
