import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { CityAutocomplete, type CityResult } from './CityAutocomplete';
import { Field, Input, cn } from './ui';
import { computeReading, type CelestialReading } from '../utils/astroEngine';
import { localBirthToUtc } from '../utils/timezone';

const DEFAULT_FORM_CLASS =
  'shrink-0 px-3 py-2.5 space-y-2 border-b border-border-hud-faint';

interface CoordinatesFormProps {
  date: string;
  time: string;
  city: CityResult;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCityChange: (v: CityResult) => void;
  onJump: (reading: CelestialReading) => void;
  /** Override the outer `<form>` className. */
  className?: string;
}

function formatTodayDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatNowTime(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Birth coordinates form (date · time · city) plus a "today" shortcut and
 * the primary CTA. Shared between the desktop sidebar and the mobile
 * coordinates modal — the only thing that varies is the outer wrapper
 * styling, controlled via `className`.
 */
export function CoordinatesForm({
  date, time, city,
  onDateChange, onTimeChange, onCityChange,
  onJump,
  className,
}: CoordinatesFormProps) {
  const reduceMotion = useReducedMotion();
  const [computing, setComputing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computing) return;
    setComputing(true);
    await new Promise((r) => setTimeout(r, 350));
    const reading = computeReading({
      date: localBirthToUtc(date, time, city.timezone),
      latitude: city.lat,
      longitude: city.lon,
      placeLabel: city.label,
      timezone: city.timezone,
    });
    onJump(reading);
    setComputing(false);
  };

  const handleJumpToNow = () => {
    const now = new Date();
    onDateChange(formatTodayDate(now));
    onTimeChange(formatNowTime(now));
    // "Aujourd'hui" bypasses the wall-clock-in-tz translation: we want the
    // actual current instant, so we feed `now` straight into computeReading.
    onJump(computeReading({
      date: now,
      latitude: city.lat,
      longitude: city.lon,
      placeLabel: city.label,
      timezone: city.timezone,
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(className ?? DEFAULT_FORM_CLASS)}
      aria-label="Coordonnées de naissance"
    >
      <div className="flex justify-end pb-0.5">
        <button
          type="button"
          onClick={handleJumpToNow}
          aria-label="Aujourd’hui — calcule le ciel actuel"
          className="cockpit-focus group inline-flex items-center gap-1
                     px-1.5 py-1 rounded
                     text-cockpit-xs tracking-cockpit-label uppercase
                     text-violet-300/75 hover:text-violet-100
                     hover:bg-violet-500/8
                     transition-colors"
        >
          <Clock
            className="size-3 transition-transform group-hover:rotate-12"
            strokeWidth={1.5}
            aria-hidden
          />
          Aujourd’hui
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <Field label="DATE">
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required
          />
        </Field>

        <Field label="HEURE">
          <Input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="LIEU DE NAISSANCE">
        <CityAutocomplete value={city} onSelect={onCityChange} />
      </Field>

      <div className="cockpit-input w-full text-cockpit-md flex items-center justify-between gap-1">
        <span>φ {city.lat.toFixed(2)}°</span>
        <span className="text-slate-600">·</span>
        <span>λ {city.lon.toFixed(2)}°</span>
      </div>

      <motion.button
        type="submit"
        disabled={computing}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className="cockpit-focus relative w-full mt-1 px-4 py-2 min-h-9 rounded-panel overflow-hidden
                   border border-border-control bg-violet-600/15
                   text-white text-cockpit-sm tracking-cockpit
                   hover:bg-violet-600/25 hover:border-accent-label
                   disabled:opacity-40 disabled:cursor-wait
                   transition-all inline-flex items-center justify-center gap-2"
      >
        <span aria-hidden className="relative z-10 text-violet-200/90 leading-none">✦</span>
        <span className="relative z-10">
          {computing ? 'Calcul du ciel…' : 'CALCULER MON SIGNE'}
        </span>
      </motion.button>
    </form>
  );
}
