import {
  Compass,
  Eye,
  LayoutDashboard,
  Lock,
  Telescope,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../ui';

export type MobileTabKey = 'selection' | 'display' | 'navigation' | 'analysis';

interface MobileTabBarProps {
  activeTab: MobileTabKey | null;
  onTabChange: (tab: MobileTabKey | null) => void;
  hasSelectedBody: boolean;
  hasReading: boolean;
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
 * The "Sélection" tab is disabled until the user picks a body in the 3D
 * scene; "Analyse" is locked behind a computed reading.
 */
export function MobileTabBar({
  activeTab,
  onTabChange,
  hasSelectedBody,
  hasReading,
}: MobileTabBarProps) {
  const tabs: TabSpec[] = [
    {
      key: 'selection',
      label: 'Sélection',
      icon: <Telescope className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: hasSelectedBody,
    },
    {
      key: 'display',
      label: 'Affichage',
      icon: <Eye className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: true,
    },
    {
      key: 'navigation',
      label: 'Navigation',
      icon: <Compass className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: true,
    },
    {
      key: 'analysis',
      label: 'Analyse',
      icon: <LayoutDashboard className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: hasReading,
      locked: !hasReading,
    },
  ];

  return (
    <nav
      role="tablist"
      aria-label="Sections de la console mobile"
      className="shrink-0 z-31
                 grid grid-cols-4 gap-1 px-2 pt-1.5
                 bg-surface-console/95 backdrop-blur-2xl
                 border-t border-border-hud-subtle
                 pb-[max(0.375rem,env(safe-area-inset-bottom,0))]"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
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
                ? 'text-cyan-100 bg-cyan-400/10'
                : 'text-slate-300/85 hover:text-slate-100 hover:bg-violet-500/10',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'shrink-0',
                active ? 'text-cyan-200' : 'text-slate-300/85',
              )}
            >
              {tab.icon}
            </span>
            <span
              className="block w-full text-center truncate
                         text-cockpit-sm leading-none uppercase tracking-cockpit-tight"
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

            {active && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-3 top-0
                           h-px bg-cyan-300
                           shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
