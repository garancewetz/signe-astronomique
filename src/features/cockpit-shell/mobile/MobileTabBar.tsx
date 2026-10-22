import { CalendarDays, Compass, Lock, Menu, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/ui';
import { useT } from '@/context/useLocale';

export type MobileTabKey = 'coords' | 'analysis' | 'explore' | 'menu';

/**
 * Distance from the viewport bottom to the tab bar's top edge — matches
 * `pt-1.5 + h-12 + pb-[max(6px, env(...))]` below. Sheets and the result
 * page stop exactly there.
 */
export const MOBILE_TAB_BAR_OFFSET =
  'calc(54px + max(0.375rem, env(safe-area-inset-bottom, 0px)))';

interface MobileTabBarProps {
  activeTab: MobileTabKey | null;
  onTabChange: (tab: MobileTabKey | null) => void;
  hasReading: boolean;
  /** Short localized true sign once computed — replaces the generic tab label. */
  signLabel: string | null;
}

interface TabSpec {
  key: MobileTabKey;
  label: string;
  icon: ReactNode;
  enabled: boolean;
  /** Padlock badge when locked (analysis without a reading). */
  locked?: boolean;
}

/**
 * Bottom tab bar — primary navigation on mobile. Tapping a tab opens the
 * sheet with that section's content; tapping the active tab closes it.
 *
 * Body selection is contextual (sheet shows it whenever something is
 * picked in the 3D scene); "Analyse" is locked behind a computed reading.
 */
export function MobileTabBar({
  activeTab,
  onTabChange,
  hasReading,
  signLabel,
}: MobileTabBarProps) {
  const t = useT();

  const tabs: TabSpec[] = [
    {
      key: 'coords',
      label: t.mobile.tabs.coords,
      icon: <CalendarDays className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: true,
    },
    {
      key: 'analysis',
      label: signLabel ?? t.mobile.tabs.analysis,
      icon: <Sparkles className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: hasReading,
      locked: !hasReading,
    },
    {
      key: 'explore',
      label: t.mobile.tabs.explore,
      icon: <Compass className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: true,
    },
    {
      key: 'menu',
      label: t.mobile.tabs.menu,
      icon: <Menu className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: true,
    },
  ];

  return (
    <nav
      role="tablist"
      aria-label={t.mobile.cockpit.navAriaLabel}
      className="relative shrink-0 z-31 touch-manipulation
                 grid grid-cols-4 gap-1 px-2 pt-1.5
                 bg-surface-console/95 backdrop-blur-2xl
                 border-t border-border-hud-subtle
                 pb-[max(0.375rem,env(safe-area-inset-bottom,0))]"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        const isAnalysisTab = tab.key === 'analysis';
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="mobile-sheet"
            aria-label={tab.label}
            disabled={!tab.enabled}
            onClick={() => onTabChange(active ? null : tab.key)}
            className={cn(
              'cockpit-focus relative h-12 rounded',
              'flex flex-col items-center justify-center gap-1',
              'overflow-hidden',
              'transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              active
                ? 'text-white bg-white/8'
                : 'text-slate-400 hover:text-slate-100',
              // Once computed, this tab carries the sign's name, in the gold
              // reserved for the true sign: no glow needed to find it.
              isAnalysisTab && hasReading && !active && 'text-amber-200',
            )}
          >
            <span aria-hidden="true" className="shrink-0">
              {tab.icon}
            </span>
            <span
              className="block w-full text-center truncate
                         text-cockpit-sm leading-none tracking-cockpit-tight"
            >
              {tab.label}
            </span>

            {tab.locked && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-1
                           grid place-items-center
                           size-3.5 rounded-full
                           bg-violet-950/85 border border-violet-400/40"
              >
                <Lock className="size-[7px] text-violet-200/85" strokeWidth={2.5} />
              </span>
            )}

          </button>
        );
      })}
    </nav>
  );
}
