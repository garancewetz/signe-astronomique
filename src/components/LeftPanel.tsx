import { motion, useReducedMotion } from 'framer-motion';
import { CityAutocomplete, type CityResult } from './CityAutocomplete';
import { computeReading, type CelestialReading } from '../utils/astroEngine';
import { localBirthToUtc } from '../utils/timezone';
import { useState } from 'react';

interface Props {
  date: string;
  time: string;
  city: CityResult;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCityChange: (v: CityResult) => void;
  onJump: (reading: CelestialReading) => void;
  onBlip: () => void;
  onClose: () => void;
}

export function LeftPanel({
  date, time, city,
  onDateChange, onTimeChange, onCityChange,
  onJump, onBlip, onClose,
}: Props) {
  const [computing, setComputing] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computing) return;
    onBlip();
    setComputing(true);
    await new Promise(r => setTimeout(r, 350));
    const reading = computeReading({
      date: localBirthToUtc(date, time, city.timezone),
      latitude: city.lat,
      longitude: city.lon,
      placeLabel: city.label,
    });
    onJump(reading);
    setComputing(false);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-violet-400/25">
        <h2 className="text-[10.5px] tracking-[0.28em] text-violet-100">
          <span className="text-violet-400">✦</span> COORDONNÉES DE NAISSANCE
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cockpit-focus inline-flex items-center gap-2 h-9 px-2.5 rounded-sm
                     border border-violet-400/30 hover:border-violet-300
                     hover:bg-violet-500/15 transition text-slate-300
                     hover:text-white text-[9px] tracking-[0.18em]"
          aria-label="Fermer le panneau coordonnées"
        >
          <CloseIcon />
          <span>FERMER</span>
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2.5">
        <Field label="DATE DE NAISSANCE">
          <input
            type="date"
            value={date}
            onChange={e => onDateChange(e.target.value)}
            className="cockpit-input w-full"
            required
          />
        </Field>

        <Field label="HEURE LOCALE">
          <input
            type="time"
            value={time}
            onChange={e => onTimeChange(e.target.value)}
            className="cockpit-input w-full"
            required
          />
        </Field>

        <Field label="LIEU DE NAISSANCE">
          <CityAutocomplete value={city} onSelect={onCityChange} />
        </Field>

        <Field label="COORDONNÉES">
          <div className="cockpit-input w-full text-[11px] flex items-center justify-between gap-1">
            <span>φ {city.lat.toFixed(2)}°</span>
            <span className="text-slate-600">·</span>
            <span>λ {city.lon.toFixed(2)}°</span>
          </div>
        </Field>

        <motion.button
          type="submit"
          disabled={computing}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="cockpit-focus relative w-full mt-3 px-6 py-2.5 min-h-11 rounded-sm overflow-hidden
                     border border-violet-400/50 bg-violet-600/15
                     text-white text-xs tracking-[0.2em]
                     hover:bg-violet-600/25 hover:border-violet-300
                     disabled:opacity-40 disabled:cursor-wait
                     transition-all inline-flex items-center justify-center gap-2"
        >
          <span aria-hidden className="relative z-10 text-violet-200/90 leading-none">✦</span>
          <span className="relative z-10">
            {computing ? 'Calcul du ciel…' : 'CALCULER MON SIGNE ASTRONOMIQUE'}
          </span>
          <span className="absolute inset-y-0 -inset-x-2
                           bg-linear-to-r from-transparent via-violet-400/15 to-transparent
                           translate-x-[-120%] hover:animate-[sweep_1.4s_ease-in-out]
                           pointer-events-none" />
        </motion.button>
      </form>

      <footer className="px-4 py-1.5 border-t border-violet-400/15
                         text-[8.5px] tracking-[0.2em] text-violet-400/60 font-mono">
        Meeus 1998 · JPL · IAU 1930
      </footer>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0" aria-hidden>
      <path d="M5 5l8 8M13 5l-8 8" strokeLinecap="round" />
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] tracking-[0.3em] text-violet-400">{label}</span>
      {children}
    </label>
  );
}
