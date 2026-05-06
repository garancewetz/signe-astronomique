import { useEffect, useState } from 'react';
import { Moon } from 'lucide-react';
import type { CelestialReading } from '../utils/astroEngine';

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
  /** Opens the RÉSUMÉ panel — wired only when a natal reading is active. */
  onOpenSummary?: () => void;
}

export function HudFrame({ reading, onOpenSummary }: HudFrameProps) {
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
    : LIVE_DATE_FORMATTER.format(liveNow);

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
      className="absolute top-0 inset-x-0 h-11
                 bg-linear-to-b from-hud-bar/95 via-hud-bar/70 to-transparent"
    >
      <h1 className="sr-only">Carte du ciel réel</h1>

      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-px
                   bg-linear-to-r from-transparent via-border-hud-subtle to-transparent"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 items-center h-full px-5 sm:px-6 gap-3">
        {/* Branding — masqué sous sm pour rendre l'écran à la vue 3D */}
        <div className="hidden sm:flex items-center gap-2 text-cockpit-sm tracking-cockpit-hud min-w-0">
          <Moon className="size-3.5 shrink-0 text-accent-label" strokeWidth={1.25} aria-hidden />
          <span aria-hidden="true" className="text-accent-title truncate">
            CARTE&nbsp;DU&nbsp;CIEL&nbsp;RÉEL
          </span>
        </div>

        {/* État central — cliquable quand un thème natal est actif (raccourci RÉSUMÉ) */}
        <div className="min-w-0 flex justify-center">
          {summaryClickable ? (
            <button
              type="button"
              onClick={onOpenSummary}
              className="cockpit-focus pointer-events-auto min-w-0 max-w-full inline-block
                         rounded-cockpit transition-opacity hover:opacity-85"
              aria-label={`Ouvrir la fiche RÉSUMÉ — ${mode} · ${main}`}
            >
              {centerInner}
            </button>
          ) : (
            centerInner
          )}
        </div>

        {/* Spacer droit — équilibre la grille pour que le centre reste optiquement centré */}
        <div className="hidden sm:block" aria-hidden />
      </div>
    </header>
  );
}
