import { CalendarDays } from 'lucide-react';
import { type Ref } from 'react';
import type { CityResult } from '@/features/natal-input';
import { useT } from '@/context/useLocale';

interface MobileHeaderProps {
  date: string;
  city: CityResult;
  coordsOpen: boolean;
  onOpenCoords: () => void;
  /** Forwarded so the parent can ResizeObserver the header for layout math. */
  ref?: Ref<HTMLElement>;
}

/**
 * Top bar of the mobile cockpit: the active natal coordinates (date +
 * city), tappable to edit them. Everything else lives in the tab bar.
 * Visual height drives the bottom sheet's full-snap math, so the parent
 * measures it via a forwarded ref.
 */
export function MobileHeader({
  date,
  city,
  coordsOpen,
  onOpenCoords,
  ref,
}: MobileHeaderProps) {
  const t = useT();
  // `date` is the form's YYYY-MM-DD — build a local Date so the day can't
  // shift through UTC, then show it the way people read dates.
  const [y, m, d] = date.split('-').map(Number);
  const dateLabel = y && m && d
    ? new Intl.DateTimeFormat(t.intlLocale, { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(y, m - 1, d))
    : date;
  return (
    <header
      ref={ref}
      className="relative shrink-0 z-10 touch-manipulation
                 min-h-[calc(2.75rem+env(safe-area-inset-top,0))]
                 pt-[env(safe-area-inset-top,0)]
                 bg-surface-console/55 backdrop-blur-xl
                 border-b border-border-hud-subtle
                 flex items-stretch"
    >
      <button
        type="button"
        onClick={onOpenCoords}
        aria-label={t.mobile.coordinatesModal.editAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={coordsOpen}
        className="cockpit-focus flex-1 min-w-0
                   flex items-center gap-2 px-3
                   hover:bg-violet-500/10 active:bg-violet-500/15
                   transition-colors text-left"
      >
        <span className="font-serif text-[15px] font-semibold text-accent-title shrink-0">
          {t.cockpit.brand}
        </span>
        <span className="text-cockpit-xs text-slate-300 truncate flex-1">
          {[dateLabel, city.label].filter(Boolean).map((part) => ` · ${part}`).join('')}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 grid place-items-center size-6 rounded
                     border border-border-hud-faint
                     bg-violet-500/10 text-violet-200"
        >
          <CalendarDays className="size-3" strokeWidth={1.6} />
        </span>
      </button>
    </header>
  );
}
