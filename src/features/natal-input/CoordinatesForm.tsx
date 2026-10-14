import { useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, ChevronRight, Minus, Plus, X } from 'lucide-react';
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
  'shrink-0 px-4 pt-4 pb-4 space-y-3 border-b border-border-hud-faint';

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
  /** Serif question shown above the fields (sidebar, mobile sheet). */
  title?: string;
  /** Focus the date on mount — desktop only, a phone would pop its picker. */
  autoFocusDate?: boolean;
  /** Hide the /signes/ link and the history chips (welcome card). */
  bare?: boolean;
  /** Recent searches surfaced as one-click chips below the form. */
  history?: SearchHistoryEntry[];
  onRecordHistory?: (entry: { date: string; time: string; city: CityResult }) => void;
  onRemoveHistory?: (signature: string) => void;
}

/**
 * Birth form, date first: the date is the only required field — it alone
 * decides the Sun's constellation, except on the rare boundary days. Time
 * and place sit behind a disclosure (noon at the current place when left
 * out), so nobody gives up for not knowing their birth hour. Shared by the
 * welcome card, the desktop sidebar and the mobile form; the wrapper
 * styling varies via `className`.
 */
export function CoordinatesForm({
  date, time, city,
  onDateChange, onTimeChange, onCityChange,
  onJump,
  className,
  title,
  autoFocusDate,
  bare,
  history,
  onRecordHistory,
  onRemoveHistory,
}: CoordinatesFormProps) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const [computing, setComputing] = useState(false);
  // Open when a time is already known (share link, restored search).
  const [detailsOpen, setDetailsOpen] = useState(() => time !== '');
  const dateId = useId();
  const timeId = useId();
  const cityId = useId();
  const detailsId = useId();
  const titleId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computing || !date) return;
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
    if (entry.time) setDetailsOpen(true);
    onJump(computeReadingFromForm(entry));
    // Re-record so the entry bubbles to the top — the user just re-confirmed
    // they care about this moment.
    onRecordHistory?.({ date: entry.date, time: entry.time, city: entry.city });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(className ?? DEFAULT_FORM_CLASS)}
      aria-label={title ? undefined : t.natalForm.ariaLabel}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && (
        <h2 id={titleId} className="font-serif text-xl font-medium leading-snug text-white">
          {title}
        </h2>
      )}

      <Field label={t.natalForm.dateLabel} htmlFor={dateId}>
        <Input
          id={dateId}
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          // Keyboard users land straight in the one field that matters.
          autoFocus={autoFocusDate}
          required
        />
      </Field>

      <div>
        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => setDetailsOpen((v) => !v)}
          className="cockpit-focus inline-flex min-h-9 items-center gap-1.5 rounded-panel
                     text-cockpit-lg text-violet-200 hover:text-white transition-colors"
        >
          {detailsOpen
            ? <Minus className="size-3.5" strokeWidth={1.6} aria-hidden />
            : <Plus className="size-3.5" strokeWidth={1.6} aria-hidden />}
          {t.natalForm.detailsToggle}
        </button>
        {!detailsOpen && (
          <p className="text-cockpit-md leading-snug text-slate-400">{t.natalForm.detailsHint}</p>
        )}
        <div id={detailsId} hidden={!detailsOpen} className="mt-2 space-y-3">
          <Field label={t.natalForm.timeLabel} htmlFor={timeId}>
            <Input
              id={timeId}
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
            />
          </Field>
          <Field label={t.natalForm.placeLabel} htmlFor={cityId}>
            <CityAutocomplete value={city} onSelect={onCityChange} inputId={cityId} />
          </Field>
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={computing}
        whileHover={reduceMotion ? undefined : { scale: 1.01 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className="cockpit-focus relative w-full min-h-12 px-4 py-2 rounded-panel overflow-hidden
                   border border-foreground bg-foreground
                   text-background text-[15px] font-semibold
                   hover:bg-white hover:border-white
                   disabled:opacity-40 disabled:cursor-wait
                   transition-all inline-flex items-center justify-center gap-2"
      >
        {computing ? t.natalForm.submitBusy : `${t.natalForm.submitIdle} →`}
      </motion.button>

      {!bare && <AllSignsLink />}

      {!bare && history && history.length > 0 && (
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
      className="cockpit-focus flex w-full items-center gap-2 min-h-11 px-3 py-2
                 rounded-panel border border-border-hud bg-surface-raised/60
                 text-cockpit-lg text-slate-200
                 hover:border-border-strong hover:text-white
                 transition-colors"
    >
      <CalendarDays className="size-4 shrink-0 text-slate-400" strokeWidth={1.4} aria-hidden />
      <span className="flex-1">{t.natalForm.allSignsLink}</span>
      <ChevronRight className="size-3.5 shrink-0 text-slate-500" strokeWidth={1.6} aria-hidden />
    </a>
  );
}
