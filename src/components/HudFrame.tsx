import { useEffect, useState } from 'react';
import {
  formatLST,
  liveTelemetry,
  type CelestialReading,
} from '../utils/astroEngine';

const NATAL_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

const LIVE_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

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
 * Slim status banner — pure mode + live telemetry. Branding now lives in
 * the sidebar header so this bar carries no logo or right-side spacer;
 * the entire band is reserved for the centered status block.
 */
export function HudFrame({
  reading,
  observerLat,
  observerLon,
  onOpenSummary,
}: HudFrameProps) {
  const [liveNow, setLiveNow] = useState(() => new Date());

  useEffect(() => {
    if (reading) return;
    const id = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [reading]);

  const isNatal = !!reading;
  const mode = isNatal ? 'CIEL NATAL' : 'CIEL EN DIRECT';
  const main = reading
    ? `${reading.trueConstellation} · ${reading.moon.constellation}`
    : null;

  const sub = reading
    ? `${reading.input.placeLabel ?? 'Ciel natal'} · ${NATAL_DATE_FORMATTER.format(reading.input.date)} UTC`
    : (() => {
        const { lstHours } = liveTelemetry(liveNow, observerLon);
        const latStr = `${Math.abs(observerLat).toFixed(2)}°${observerLat >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(observerLon).toFixed(2)}°${observerLon >= 0 ? 'E' : 'W'}`;
        return `${LIVE_DATE_FORMATTER.format(liveNow)} · LST ${formatLST(lstHours)} · ${latStr} ${lonStr}`;
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
      <h1 className="sr-only">Carte du ciel réel</h1>

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
            aria-label={`Ouvrir la fiche MON SIGNE — ${mode} · ${main}`}
          >
            {centerInner}
          </button>
        ) : (
          centerInner
        )}
      </div>
    </header>
  );
}
