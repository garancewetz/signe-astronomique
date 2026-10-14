import { useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, ChevronRight, X } from 'lucide-react';
import { CityAutocomplete, type CityResult } from './CityAutocomplete';
import { Field, Input, cn } from '@/ui';
import type { CelestialReading } from '@/features/astronomy';
import { computeReadingFromForm } from './computeReadingFromForm';
import {
  signatureOf,
  type SearchHistoryEntry,
} from './useSearchHistory';
import { useT } from '@/context/useLocale';

/** Recent searches shown under the form — older ones stay stored. */
const VISIBLE_HISTORY = 3;

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
  /** Recent searches surfaced as one-click chips below the form. */
  history?: SearchHistoryEntry[];
  onRecordHistory?: (entry: { date: string; time: string; city: CityResult }) => void;
  onRemoveHistory?: (signature: string) => void;
}

/**
 * Birth coordinates form (date · time · city) plus the primary CTA. Shared between the desktop sidebar and the mobile
 * coordinates modal — the only thing that varies is the outer wrapper
 * styling, controlled via `className`.
 */
export function CoordinatesForm({
  date, time, city,
  onDateChange, onTimeChange, onCityChange,
  onJump,
  className,
  history,
  onRecordHistory,
  onRemoveHistory,
}: CoordinatesFormProps) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const [computing, setComputing] = useState(false);
  const dateId = useId();
  const timeId = useId();
  const cityId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computing) return;
    setComputing(true);
    await new Promise((r) => setTimeout(r, 350));
    onJump(computeReadingFromForm({ date, time, city }));
    onRecordHistory?.({ date, time, city });
    setComputing(false);
  };

  const handleRestore = (entry: SearchHistoryEntry) => {
    onDateChange(entry.date);
    onTimeChange(entry.time);
    onCityChange(entry.city);
    onJump(computeReadingFromForm(entry));
    // Re-record so the entry bubbles to the top — the user just re-confirmed
    // they care about this moment.
    onRecordHistory?.({ date: entry.date, time: entry.time, city: entry.city });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(className ?? DEFAULT_FORM_CLASS)}
      aria-label={t.natalForm.ariaLabel}
    >
      <div className="grid grid-cols-2 gap-2 items-end">
        <Field label={t.natalForm.dateLabel} htmlFor={dateId}>
          <Input
            id={dateId}
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required
          />
        </Field>

        <Field label={t.natalForm.timeLabel} htmlFor={timeId}>
          <Input
            id={timeId}
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label={t.natalForm.placeLabel} htmlFor={cityId}>
        <CityAutocomplete value={city} onSelect={onCityChange} inputId={cityId} />
      </Field>

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
          {computing ? t.natalForm.submitBusy : t.natalForm.submitIdle}
        </span>
      </motion.button>

      <AllSignsLink />

      {history && history.length > 0 && (
        <SearchHistoryList
          entries={history.slice(0, VISIBLE_HISTORY)}
          onRestore={handleRestore}
          onRemove={onRemoveHistory}
        />
      )}
    </form>
  );
}

/* ── Recent-searches chips ───────────────────────────────────────────── */

interface SearchHistoryListProps {
  entries: SearchHistoryEntry[];
  onRestore: (entry: SearchHistoryEntry) => void;
  onRemove?: (signature: string) => void;
}

function SearchHistoryList({ entries, onRestore, onRemove }: SearchHistoryListProps) {
  const t = useT();
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(t.intlLocale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [t.intlLocale],
  );

  const formatEntryDate = (iso: string): string => {
    // `iso` is YYYY-MM-DD; build a local Date so day/month don't shift via UTC.
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return dateFormatter.format(new Date(y, m - 1, d));
  };

  return (
    <section
      aria-label={t.searchHistory.listAriaLabel}
      className="pt-2 space-y-1"
    >
      <div
        className="px-0.5 text-cockpit-xs tracking-cockpit-label uppercase
                   text-slate-500"
      >
        {t.searchHistory.sectionLabel}
      </div>
      <ul role="list" className="flex flex-wrap gap-1">
        {entries.map((entry) => {
          const sig = signatureOf(entry);
          const dateLabel = formatEntryDate(entry.date);
          const full = `${dateLabel} · ${entry.city.label}`;
          return (
            <li key={sig} className="min-w-0">
              <div
                className="cockpit-focus group inline-flex items-stretch
                           rounded border border-white/8 bg-white/3
                           hover:bg-white/6 hover:border-white/15
                           transition-colors max-w-full"
              >
                <button
                  type="button"
                  onClick={() => onRestore(entry)}
                  title={full}
                  aria-label={t.searchHistory.restoreAriaLabel(dateLabel, entry.city.label)}
                  className="cockpit-focus min-w-0 inline-flex items-center gap-1
                             px-1.5 py-1 text-cockpit-xs tracking-cockpit-tight
                             text-slate-200 hover:text-white text-left"
                >
                  <span className="shrink-0 text-violet-300/85">{dateLabel}</span>
                  <span aria-hidden className="shrink-0 text-slate-600">·</span>
                  <span className="truncate text-slate-400 group-hover:text-slate-200 max-w-28">
                    {entry.city.label}
                  </span>
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(sig);
                    }}
                    aria-label={t.searchHistory.removeAriaLabel(dateLabel, entry.city.label)}
                    className="cockpit-focus shrink-0 grid place-items-center
                               px-1 border-l border-white/8
                               text-slate-500 hover:text-rose-200
                               hover:bg-rose-500/10 transition-colors"
                  >
                    <X className="size-3" strokeWidth={1.6} aria-hidden />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Static /signes/ page (true dates of the 13 signs) — always reachable. */
function AllSignsLink() {
  const t = useT();
  return (
    <a
      href="/signes/"
      className="cockpit-focus flex w-full items-center gap-2 min-h-9 px-3 py-2
                 rounded-panel border border-amber-300/30 bg-amber-400/6
                 text-cockpit-sm text-amber-100/90
                 hover:bg-amber-400/12 hover:border-amber-300/55 hover:text-amber-50
                 transition-colors"
    >
      <CalendarDays className="size-4 shrink-0 text-amber-200/80" strokeWidth={1.4} aria-hidden />
      <span className="flex-1">{t.natalForm.allSignsLink}</span>
      <ChevronRight className="size-3.5 shrink-0 text-amber-200/60" strokeWidth={1.6} aria-hidden />
    </a>
  );
}
