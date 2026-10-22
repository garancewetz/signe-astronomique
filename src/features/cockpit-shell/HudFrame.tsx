import { memo, useMemo } from 'react';
import {
  loreName,
  loreShortName,
  sunSigns,
  type CelestialReading,
} from '@/features/astronomy';
import { useT } from '@/context/useLocale';
import { WELCOME_EVENTS } from './welcomeEvents';

/** Birth date (and time, when given) pinned to the birth location's
 *  timezone. Falls back to UTC (with a visible suffix) when the timezone
 *  is unknown. An unknown time is computed at noon: never show "12:00". */
function formatNatalDate(
  date: Date,
  timezone: string | undefined,
  intlLocale: string,
  timeKnown: boolean,
  timeUnknownLabel: string,
): string {
  const tz = timezone ?? 'UTC';
  if (!timeKnown) {
    const day = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium', timeZone: tz }).format(date);
    return `${day}, ${timeUnknownLabel}`;
  }
  const fmt = new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: tz,
  });
  return timezone ? fmt.format(date) : `${fmt.format(date)} UTC`;
}

interface HudFrameProps {
  reading: CelestialReading | null;
  /** False when the birth time was left out (computed at noon). */
  birthTimeKnown: boolean;
  /** Opens the result panel — wired only when a natal reading is active. */
  onOpenSummary?: () => void;
}

/**
 * Top banner, centred over the sky. Before a calculation it carries the
 * site's question and today's proof (horoscope sign vs the real sky), with
 * a "Pourquoi ?" link that opens the welcome card's explanation; after it,
 * the natal sign, place and date. Branding lives in the sidebar header.
 */
export const HudFrame = memo(function HudFrame({
  reading,
  birthTimeKnown,
  onOpenSummary,
}: HudFrameProps) {
  const t = useT();
  // Once per mount: the Sun changes constellation at most once a day.
  const today = useMemo(() => sunSigns(new Date()), []);

  if (!reading) {
    const horoscope = loreShortName(today.tropical);
    const sky = loreShortName(today.constellation);
    return (
      <header
        role="banner"
        className="relative h-[4.5rem]
                   bg-linear-to-b from-hud-bar/95 via-hud-bar/80 to-transparent"
      >
        <h1 className="sr-only">{t.cockpit.srTitle}</h1>
        <div className="flex flex-col items-center justify-center h-full px-4 text-center">
          <p className="max-w-full truncate font-serif text-xl font-medium leading-tight text-white">
            {t.hudFrame.liveQuestion}
          </p>
          <p className="mt-1 max-w-full truncate text-cockpit-lg text-slate-300">
            <Bold
              text={today.tropical === today.constellation
                ? t.hudFrame.todaySame(sky)
                : t.hudFrame.todayDiffer(horoscope, sky)}
            />{' '}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(WELCOME_EVENTS.open))}
              className="cockpit-focus pointer-events-auto rounded-cockpit
                         text-violet-200 underline underline-offset-2
                         decoration-violet-200/40 hover:text-white transition-colors"
            >
              {t.hudFrame.why}
            </button>
          </p>
        </div>
      </header>
    );
  }

  const mode = t.hudFrame.modeNatal;
  const main = `☉ ${loreName(reading.trueConstellation)}`;
  const sub = [reading.input.placeLabel, formatNatalDate(reading.input.date, reading.input.timezone, t.intlLocale, birthTimeKnown, t.signReveal.timeUnknown)]
    .filter(Boolean)
    .join(' · ');

  const summaryClickable = !!onOpenSummary;

  const centerInner = (
    <div className="min-w-0 max-w-full text-center leading-tight">
      <div className="flex items-baseline justify-center gap-2.5 min-w-0">
        <span className="shrink-0 text-cockpit-sm text-slate-400">
          {mode}
        </span>
        <span className="text-cockpit-md tracking-wide text-slate-100 truncate min-w-0">
          {main}
        </span>
      </div>
      <div className="text-cockpit-sm text-slate-400 truncate mt-0.5">
        {sub}
      </div>
    </div>
  );

  return (
    <header
      role="banner"
      className="relative h-11
                 bg-linear-to-b from-hud-bar/95 via-hud-bar/70 to-transparent"
    >
      <h1 className="sr-only">{t.cockpit.srTitle}</h1>

      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-px
                   bg-linear-to-r from-transparent via-border-hud-subtle to-transparent"
      />

      <div className="flex items-center justify-center h-full px-4">
        {summaryClickable ? (
          <button
            type="button"
            onClick={onOpenSummary}
            className="cockpit-focus pointer-events-auto min-w-0 max-w-full inline-block
                       rounded-cockpit transition-opacity hover:opacity-85"
            aria-label={t.hudFrame.summaryAriaLabel(mode, main)}
          >
            {centerInner}
          </button>
        ) : (
          centerInner
        )}
      </div>
    </header>
  );
});

/** Renders **bold** spans of a copy string as gold strong text. */
function Bold({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) =>
        i % 2 ? <strong key={i} className="font-semibold text-amber-200">{part}</strong> : part,
      )}
    </>
  );
}
