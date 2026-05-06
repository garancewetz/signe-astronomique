import { useEffect, useState } from 'react';
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
                      bg-linear-to-b from-[#0d0825]/95 via-[#0d0825]/70 to-transparent">
        <div className="absolute bottom-0 inset-x-0 h-px
                        bg-linear-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="flex items-center justify-between h-full px-5 sm:px-6">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-24">
            <div className="min-w-0 max-w-2xl text-center leading-tight">
              <div className="flex items-center justify-center gap-2 min-w-0">
                <span className="shrink-0 text-[8px] tracking-[0.28em] uppercase text-violet-300/85">
                  {mode}
                </span>
                <span className="text-[10px] tracking-[0.04em] text-slate-200 truncate">
                  {main}
                </span>
              </div>
              <div className="text-[8px] tracking-[0.06em] text-slate-500 truncate mt-0.5">
                {sub}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] tracking-[0.35em]">
            <MoonGlyph />
            <span className="text-violet-100">CARTE&nbsp;DU&nbsp;CIEL&nbsp;RÉEL</span>
          </div>

          <div className="text-[9px] tracking-[0.25em] text-slate-500 flex items-center gap-2">
            <span>IAU&nbsp;1930</span>
            <StarDot />
          </div>
        </div>
      </div>

      {/* ─── Séparateur bas ─────────────────────────────────────────── */}
      <div className="absolute bottom-20 inset-x-0 h-px
                      bg-linear-to-r from-transparent via-violet-400/20 to-transparent" />
    </>
  );
}

function MoonGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-violet-300">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="0.9" />
      <path d="M7 1.5 C4.5 1.5 2.5 4 2.5 7 C2.5 10 4.5 12.5 7 12.5 C5.2 11 4.2 9.1 4.2 7 C4.2 4.9 5.2 3 7 1.5Z"
            fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function StarDot() {
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" className="text-slate-500">
      <path d="M3.5 0 L4.1 2.9 L7 3.5 L4.1 4.1 L3.5 7 L2.9 4.1 L0 3.5 L2.9 2.9 Z"
            fill="currentColor" />
    </svg>
  );
}
