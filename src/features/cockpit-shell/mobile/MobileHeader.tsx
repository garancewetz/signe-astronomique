import { CalendarDays, MoreVertical } from 'lucide-react';
import { type Ref } from 'react';
import type { CityResult } from '@/features/natal-input';
import { useT } from '@/context/useLocale';

interface MobileHeaderProps {
  date: string;
  city: CityResult;
  coordsOpen: boolean;
  drawerOpen: boolean;
  onOpenCoords: () => void;
  onToggleDrawer: () => void;
  /** Forwarded so the parent can ResizeObserver the header for layout math. */
  ref?: Ref<HTMLElement>;
}

/**
 * Top bar of the mobile cockpit. The left chip shows the active natal
 * coordinates (date + city) and acts as the primary entry point to edit
 * them; the right button toggles the system drawer (export, share,
 * language…). Visual height drives the bottom sheet's full-snap math, so
 * the parent measures it via a forwarded ref.
 */
export function MobileHeader({
  date,
  city,
  coordsOpen,
  drawerOpen,
  onOpenCoords,
  onToggleDrawer,
  ref,
}: MobileHeaderProps) {
  const t = useT();
  return (
    <header
      ref={ref}
      className="shrink-0 z-10
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
        <span
          aria-hidden="true"
          className="inline-block size-1.5 rounded-full bg-cyan-300
                     shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]"
        />
        <span className="text-cockpit-sm tracking-cockpit-hud text-accent-title uppercase shrink-0">
          {t.cockpit.brand}
        </span>
        <span className="text-cockpit-xs text-slate-300 truncate flex-1">
          · {date} · {city.label}
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
      <button
        type="button"
        onClick={onToggleDrawer}
        aria-label={t.mobile.systemDrawer.openAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
        className="cockpit-focus shrink-0 grid place-items-center
                   w-11
                   border-l border-border-hud-faint
                   text-slate-300/85 hover:text-slate-100
                   hover:bg-violet-500/10 transition-colors"
      >
        <MoreVertical className="size-4" strokeWidth={1.5} aria-hidden />
      </button>
    </header>
  );
}
