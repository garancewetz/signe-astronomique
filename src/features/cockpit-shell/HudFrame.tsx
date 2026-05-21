import { memo, useEffect, useMemo, useState } from 'react';
import {
  formatLST,
  liveTelemetry,
  type CelestialReading,
} from '@/features/astronomy';
import { useT } from '@/context/useLocale';

/** Birth-time formatter pinned to the birth location's timezone. Falls
 *  back to UTC (with a visible suffix) when the timezone is unknown. */
function formatNatalDate(date: Date, timezone: string | undefined, intlLocale: string): string {
  const tz = timezone ?? 'UTC';
  const fmt = new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: tz,
  });
  return timezone ? fmt.format(date) : `${fmt.format(date)} UTC`;
}

interface HudFrameProps {
  reading: CelestialReading | null;
  /** Observer latitude (deg N) — used for the live telemetry line. */
  observerLat: number;
  /** Observer longitude (deg E) — used for the live telemetry line. */
  observerLon: number;
  /** Opens the MON SIGNE panel — wired only when a natal reading is active. */
  onOpenSummary?: () => void;
}

/**
 * Slim status banner — pure mode + live telemetry. Branding lives in the
 * sidebar header and camera fly-to controls now sit in the sidebar's
 * Caméra section, so this bar carries only the centered status block.
 */
export const HudFrame = memo(function HudFrame({
  reading,
  observerLat,
  observerLon,
  onOpenSummary,
}: HudFrameProps) {
  const t = useT();
  const liveDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(t.intlLocale, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }),
    [t.intlLocale],
  );
  const [liveNow, setLiveNow] = useState(() => new Date());

  useEffect(() => {
    if (reading) return;
    const id = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [reading]);

  const isNatal = !!reading;
  const mode = isNatal ? t.hudFrame.modeNatal : t.hudFrame.modeLive;
  const main = reading
    ? `${reading.trueConstellation} · ${reading.moon.constellation}`
    : null;

  const sub = reading
    ? `${reading.input.placeLabel ?? t.hudFrame.placeLabelFallback} · ${formatNatalDate(reading.input.date, reading.input.timezone, t.intlLocale)}`
    : (() => {
        const { lstHours } = liveTelemetry(liveNow, observerLon);
        const latStr = `${Math.abs(observerLat).toFixed(2)}°${observerLat >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(observerLon).toFixed(2)}°${observerLon >= 0 ? 'E' : 'W'}`;
        return `${liveDateFormatter.format(liveNow)} · LST ${formatLST(lstHours)} · ${latStr} ${lonStr}`;
      })();

  const summaryClickable = isNatal && !!onOpenSummary;

  const centerInner = (
    <div className="min-w-0 max-w-full text-center leading-tight">
      <div className="flex items-baseline justify-center gap-2.5 min-w-0">
        <span className="shrink-0 text-cockpit-sm tracking-cockpit-label uppercase text-accent-label">
          {mode}
        </span>
        {main && (
          <span className="text-cockpit-md tracking-wide text-slate-100 truncate min-w-0">
            {main}
          </span>
        )}
      </div>
      <div
        className="text-cockpit-xs tracking-wide text-slate-500 truncate mt-0.5"
        aria-live={isNatal ? 'off' : 'polite'}
      >
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
            aria-label={t.hudFrame.summaryAriaLabel(mode, main ?? '')}
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
