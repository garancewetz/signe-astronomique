import { memo, useEffect, useState } from 'react';
import {
  formatLST,
  liveTelemetry,
  type CelestialReading,
} from '../utils/astroEngine';
import { TooltipWrap } from './Tooltip';
import { IconButton } from './ui';

const LIVE_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

/** Birth-time formatter pinned to the birth location's timezone. Falls
 *  back to UTC (with a visible suffix) when the timezone is unknown. */
function formatNatalDate(date: Date, timezone: string | undefined): string {
  const tz = timezone ?? 'UTC';
  const fmt = new Intl.DateTimeFormat('fr-FR', {
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
  /** Camera fly-to actions — exposed as quick-access buttons in the banner. */
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;
}

/**
 * Slim status banner — pure mode + live telemetry. Branding now lives in
 * the sidebar header so this bar carries no logo or right-side spacer;
 * the entire band is reserved for the centered status block.
 */
export const HudFrame = memo(function HudFrame({
  reading,
  observerLat,
  observerLon,
  onOpenSummary,
  onFlySun,
  onFlyMoon,
  onFlyEarth,
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
    ? `${reading.input.placeLabel ?? 'Ciel natal'} · ${formatNatalDate(reading.input.date, reading.input.timezone)}`
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

        {/* Caméra rapide — Soleil / Lune / Terre. Groupés dans un mini-rail
            avec bordure et fond subtil pour qu'ils se lisent comme un
            cluster « visée caméra » plutôt que des glyphes flottants à
            droite du bloc centré. Position absolue pour ne pas pousser
            le bloc centré ; pointer-events réactivés ponctuellement
            (le banner parent est en pointer-events-none). */}
        <div
          role="group"
          aria-label="Caméra rapide"
          className="pointer-events-auto absolute right-3 inset-y-0
                     my-1.5 flex items-center gap-0.5
                     rounded-cockpit border border-border-hud-subtle
                     bg-surface-console/55 backdrop-blur-sm
                     px-1 shadow-cockpit-dock"
        >
          <TooltipWrap text="Centrer sur le Soleil" placement="bottom">
            <IconButton
              size="sm"
              onClick={onFlySun}
              aria-label="Centrer la caméra sur le Soleil"
            >
              <span
                aria-hidden="true"
                className="text-cockpit-glyph leading-none text-glyph-sun"
              >
                ☀
              </span>
            </IconButton>
          </TooltipWrap>
          <TooltipWrap text="Centrer sur la Lune" placement="bottom">
            <IconButton
              size="sm"
              onClick={onFlyMoon}
              aria-label="Centrer la caméra sur la Lune"
            >
              <span
                aria-hidden="true"
                className="text-cockpit-glyph leading-none text-glyph-moon"
              >
                ☾
              </span>
            </IconButton>
          </TooltipWrap>
          <TooltipWrap text="Revenir à la Terre" placement="bottom">
            <IconButton
              size="sm"
              onClick={onFlyEarth}
              aria-label="Revenir à la vue orbitale par défaut"
            >
              <span
                aria-hidden="true"
                className="text-cockpit-glyph leading-none text-glyph-earth"
              >
                ⊕
              </span>
            </IconButton>
          </TooltipWrap>
        </div>
      </div>
    </header>
  );
});
