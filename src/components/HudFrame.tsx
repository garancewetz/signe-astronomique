import { useEffect, useState } from 'react';
import { Moon, Star } from 'lucide-react';
import type { CelestialReading } from '../utils/astroEngine';

interface HudFrameProps {
  reading: CelestialReading | null;
}

export function HudFrame({ reading }: HudFrameProps) {
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
    : 'En attente de tes coordonnées';
  const sub = reading
    ? `${reading.input.placeLabel ?? 'Ciel natal'} · ${new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(reading.input.date)} UTC`
    : `Ciel actuel · ${new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(liveNow)}`;

  return (
    <>
      {/* ─── Barre du haut — identitaire (titre + cartouche IAU) ────── */}
      <div className="absolute top-0 inset-x-0 h-11
                      bg-linear-to-b from-hud-bar/95 via-hud-bar/70 to-transparent">
        <div className="absolute bottom-0 inset-x-0 h-px
                        bg-linear-to-r from-transparent via-accent-label/40 to-transparent" />
        <div className="flex items-center justify-between h-full px-5 sm:px-6">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-24">
            <div className="min-w-0 max-w-2xl text-center leading-tight">
              <div className="flex items-center justify-center gap-2 min-w-0">
                <span className="shrink-0 text-cockpit-xs tracking-cockpit-label uppercase text-accent-label/85">
                  {mode}
                </span>
                <span className="text-cockpit-sm tracking-wide text-slate-200 truncate">
                  {main}
                </span>
              </div>
              <div className="text-cockpit-xs tracking-wide text-slate-500 truncate mt-0.5">
                {sub}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-cockpit-sm tracking-cockpit-hud">
            <MoonGlyph />
            <span className="text-accent-title">CARTE&nbsp;DU&nbsp;CIEL&nbsp;RÉEL</span>
          </div>

          <div className="text-cockpit-sm tracking-[0.25em] text-slate-500 flex items-center gap-2">
            <span>IAU&nbsp;1930</span>
            <StarDot />
          </div>
        </div>
      </div>

      {/* ─── Séparateur bas ─────────────────────────────────────────── */}
      <div className="absolute bottom-20 inset-x-0 h-px
                      bg-linear-to-r from-transparent via-border-hud-subtle to-transparent" />
    </>
  );
}

function MoonGlyph() {
  return <Moon className="size-3.5 shrink-0 text-accent-label" strokeWidth={1.25} aria-hidden />;
}

function StarDot() {
  return <Star className="size-2 shrink-0 text-slate-500 fill-current" strokeWidth={1.5} aria-hidden />;
}
