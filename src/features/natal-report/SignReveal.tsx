import { Fragment, type ReactNode } from 'react';
import { CalendarDays, Check, Link2 } from 'lucide-react';
import {
  loreName,
  loreShortName,
  nearestBoundary,
  type CelestialReading,
  type IauConstellation,
} from '@/features/astronomy';
import { Button, cn } from '@/ui';
import { useLocale, useT } from '@/context/useLocale';

// U+FE0E asks for the text (not emoji) presentation of each glyph.
const SIGN_GLYPH: Record<IauConstellation, string> = {
  Aries: '♈\uFE0E', Taurus: '♉\uFE0E', Gemini: '♊\uFE0E', Cancer: '♋\uFE0E',
  Leo: '♌\uFE0E', Virgo: '♍\uFE0E', Libra: '♎\uFE0E', Scorpio: '♏\uFE0E',
  Ophiuchus: '⛎\uFE0E', Sagittarius: '♐\uFE0E', Capricorn: '♑\uFE0E',
  Aquarius: '♒\uFE0E', Pisces: '♓\uFE0E',
};

interface SignRevealProps {
  reading: CelestialReading;
  /** When set, shows the CTA that flies the camera to the constellation. */
  onRevealConstellation?: () => void;
  /** When set, shows a share button under the CTA. */
  onShare?: () => void;
  shareCopied?: boolean;
  /** Shows the link to the static /signes/ page (off in the PDF export). */
  showAllSignsLink?: boolean;
  /** False when the time was left out (computed at noon): near a boundary, ask for it. */
  birthTimeKnown?: boolean;
}

/** Births closer than this to a boundary get the "on the edge" note. */
const EDGE_DAYS = 3;

/**
 * The one screen people actually read: their true sign, what their
 * horoscope says instead, and a diagram of what a sign actually is: the
 * constellation lined up behind the Sun, seen from Earth.
 */
export function SignReveal({
  reading, onRevealConstellation, onShare, shareCopied = false,
  showAllSignsLink = false, birthTimeKnown = true,
}: SignRevealProps) {
  const t = useT();
  const { locale } = useLocale();
  const birth = reading.input.date;
  const trueSign = reading.trueConstellation;
  const horoscopeSign = reading.tropicalSign;
  const same = trueSign === horoscopeSign;
  const trueName = loreName(trueSign, locale);
  const horoscopeName = loreName(horoscopeSign, locale);
  const edge = nearestBoundary(reading.sunSiderealLongitude);
  const onEdge = edge.days < EDGE_DAYS;

  const birthFmt = new Intl.DateTimeFormat(t.intlLocale, {
    day: 'numeric', month: 'long', timeZone: reading.input.timezone ?? 'UTC',
  });
  const birthDay = birthFmt.format(birth);

  return (
    <div className="space-y-5 text-slate-200">
      <div className="text-center space-y-1">
        <div
          aria-hidden="true"
          className="text-5xl leading-none text-amber-200"
        >
          {SIGN_GLYPH[trueSign]}
        </div>
        <p className="font-serif text-4xl font-medium tracking-tight text-amber-200 text-balance">
          {trueName}
        </p>
        <p className="text-cockpit-lg text-slate-400">
          {birthDay}
          {reading.input.placeLabel ? ` · ${reading.input.placeLabel}` : ''}
        </p>
      </div>

      {same ? (
        <div className="rounded-panel border border-emerald-400/30 bg-emerald-500/8
                        px-4 py-3 text-center text-cockpit-xl text-emerald-200">
          ✓ {t.signReveal.sameTitle}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-center">
          <SignVerdict
            label={t.signReveal.horoscopeSays}
            name={horoscopeName}
            tone="muted"
          />
          <SignVerdict
            label={t.signReveal.skySays}
            name={trueName}
            tone="gold"
          />
        </div>
      )}

      {onEdge && (
        <div className="rounded-panel border border-border-hud-strong bg-surface-raised/60
                        px-4 py-3 space-y-1.5 text-cockpit-lg leading-relaxed text-slate-300">
          <div className="font-medium text-white">{t.signReveal.edgeTitle}</div>
          <p>
            <Rich
              text={(edge.side === 'leaving' ? t.signReveal.edgeLeaving : t.signReveal.edgeEntered)(
                t.signReveal.edgeDays(Math.round(edge.days)),
                loreShortName(edge.neighbour, locale),
              )}
            />
          </p>
          {!birthTimeKnown && <p className="text-slate-400">{t.signReveal.edgeAddTime}</p>}
        </div>
      )}

      <section className="space-y-2 text-cockpit-xl leading-relaxed text-slate-300">
        <SectionTitle>{t.signReveal.whatTitle}</SectionTitle>
        <SkyAlignment sign={trueSign} />
        <p><Rich text={t.signReveal.alignmentBody(trueName)} /></p>
        {onRevealConstellation && <p className="text-slate-400">{t.signReveal.skyBandHint}</p>}
      </section>

      <section className="space-y-2 text-cockpit-xl leading-relaxed text-slate-300">
        <SectionTitle>{t.signReveal.whyTitle}</SectionTitle>
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
      </section>

      {onRevealConstellation && (
        <Button
          variant="solid"
          size="lg"
          onClick={onRevealConstellation}
          className="w-full text-cockpit-lg tracking-normal"
        >
          {t.signReveal.revealCta(trueName)}
        </Button>
      )}
      {onShare && (
        <Button
          variant="ghost"
          size="md"
          onClick={onShare}
          className="w-full -mt-3 text-cockpit-lg tracking-normal"
        >
          {shareCopied
            ? <Check className="size-3.5" strokeWidth={1.6} aria-hidden />
            : <Link2 className="size-3.5" strokeWidth={1.6} aria-hidden />}
          {shareCopied ? t.sidebar.result.shareCopied : t.sidebar.result.share}
        </Button>
      )}
      {showAllSignsLink && (
        <a
          href="/signes/"
          className="cockpit-focus flex w-full items-center justify-center gap-2 min-h-11 px-4
                     rounded-panel border border-violet-400/35 bg-violet-500/10
                     text-cockpit-lg text-violet-100
                     hover:bg-violet-500/20 hover:border-violet-300/60
                     transition-colors"
        >
          <CalendarDays className="size-3.5" strokeWidth={1.5} aria-hidden />
          {t.signReveal.allSignsLink}
        </a>
      )}
    </div>
  );
}

function SignVerdict({
  label, name, tone,
}: { label: string; name: string; tone: 'muted' | 'gold' }) {
  const gold = tone === 'gold';
  return (
    <div
      className={cn(
        'rounded-panel border px-3 py-3 space-y-1',
        gold
          ? 'border-amber-300/45 bg-amber-400/10'
          : 'border-white/10 bg-white/3',
      )}
    >
      <div className="text-cockpit-sm tracking-cockpit-caps uppercase text-slate-400">
        {label}
      </div>
      <div
        className={cn(
          'text-lg leading-snug font-medium break-words',
          gold ? 'text-amber-200' : 'text-slate-400 line-through decoration-slate-500/70',
        )}
      >
        {name}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-serif text-lg font-medium leading-snug text-white">
      {children}
    </h3>
  );
}

/* ── Sky alignment — Earth → Sun → constellation, the definition of a sign ── */

/** Zodiac constellations in the order the Sun crosses them. */
const ZODIAC_ORDER: readonly IauConstellation[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra',
  'Scorpio', 'Ophiuchus', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** Eight short rays around the Sun disc at (128, 80). */
const SUN_RAYS = Array.from({ length: 8 }, (_, k) => {
  const a = (k * Math.PI) / 4;
  const p = (d: number) => `${(128 + d * Math.cos(a)).toFixed(1)} ${(80 + d * Math.sin(a)).toFixed(1)}`;
  return `M ${p(12)} L ${p(16)}`;
}).join(' ');

/** A small generic star pattern drawn around (0, 0). */
const PATTERN: ReadonlyArray<[number, number]> = [
  [-14, -9], [-4, -13], [6, -4], [15, 5], [3, 12],
];

function SkyAlignment({ sign }: { sign: IauConstellation }) {
  const t = useT();
  const { locale } = useLocale();
  const i = ZODIAC_ORDER.indexOf(sign);
  const prev = ZODIAC_ORDER[(i - 1 + ZODIAC_ORDER.length) % ZODIAC_ORDER.length];
  const next = ZODIAC_ORDER[(i + 1) % ZODIAC_ORDER.length];
  const name = loreShortName(sign, locale);
  const cx = 256;
  const cy = 80;
  const pts = PATTERN.map(([x, y]) => `${cx + x},${cy + y}`).join(' ');

  return (
    <svg
      viewBox="0 0 320 150"
      className="w-full max-w-sm mx-auto h-auto font-mono"
      role="img"
      aria-label={t.signReveal.alignmentAriaLabel(name)}
    >
      {/* Earth's orbit around the Sun */}
      <ellipse cx="128" cy="80" rx="90" ry="30" fill="none"
        className="stroke-slate-500/50" strokeDasharray="3 4" />

      {/* Line of sight: Earth → Sun → constellation */}
      <line x1="46" y1="80" x2="226" y2="80"
        className="stroke-amber-200/70" strokeWidth="1.2" strokeDasharray="5 4" />
      <path d="M 220 75 L 228 80 L 220 85" fill="none" className="stroke-amber-200/70" strokeWidth="1.2" />

      {/* Neighbour constellations — faded, the Sun is not in front of them */}
      <text x={cx} y="22" textAnchor="middle" className="fill-slate-500 text-[12px]">
        {SIGN_GLYPH[prev]} {loreShortName(prev, locale)}
      </text>
      <text x={cx} y="146" textAnchor="middle" className="fill-slate-500 text-[12px]">
        {SIGN_GLYPH[next]} {loreShortName(next, locale)}
      </text>

      {/* Your constellation */}
      <circle cx={cx} cy={cy} r="26" className="fill-amber-300/10 stroke-amber-300/40" />
      <polyline points={pts} fill="none" className="stroke-amber-200" strokeWidth="1" />
      {PATTERN.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={cx + x} cy={cy + y} r="1.8" className="fill-amber-100" />
      ))}
      <text x={cx} y="122" textAnchor="middle" className="fill-amber-200 text-[15px] font-semibold">
        {SIGN_GLYPH[sign]} {name}
      </text>

      {/* Sun — line icons, same as the static pages (emoji differ per OS) */}
      <circle cx="128" cy="80" r="9" className="fill-amber-200/85" />
      <path d={SUN_RAYS} fill="none" className="stroke-amber-200" strokeWidth="1.3" strokeLinecap="round" />
      <text x="128" y="112" textAnchor="middle" className="fill-slate-300 text-[12px]">
        {t.signReveal.sun}
      </text>

      {/* Earth */}
      <g fill="none" stroke="#9fb4e8" strokeWidth="1.2">
        <circle cx="32" cy="80" r="9" fill="rgba(110,140,210,0.18)" />
        <ellipse cx="32" cy="80" rx="9" ry="3.4" />
        <ellipse cx="32" cy="80" rx="3.8" ry="9" />
      </g>
      <text x="32" y="102" textAnchor="middle" className="fill-slate-300 text-[12px]">
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
