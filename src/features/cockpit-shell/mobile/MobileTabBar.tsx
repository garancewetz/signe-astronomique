import {
  Compass,
  Eye,
  LayoutDashboard,
  Lock,
  Telescope,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/ui';
import { useT } from '@/context/useLocale';

export type MobileTabKey = 'selection' | 'display' | 'navigation' | 'analysis';

const UNLOCK_WINDOW_MS = 1200;

interface MobileTabBarProps {
  activeTab: MobileTabKey | null;
  onTabChange: (tab: MobileTabKey | null) => void;
  hasSelectedBody: boolean;
  hasReading: boolean;
  /** Bumps on each new reading — pulses the Analyse tab (parity with desktop CTA). */
  analysisAttention: number;
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
  analysisAttention,
}: MobileTabBarProps) {
  const t = useT();
  // Pulse the Analyse tab whenever a new reading is computed. Same pattern
  // as the desktop sidebar CTA — derive the trigger from a prop change at
  // render time, then run the one-shot timer in an effect.
  const [unlocking, setUnlocking] = useState(false);
  const [lastAttention, setLastAttention] = useState(analysisAttention);
  if (analysisAttention !== lastAttention) {
    setLastAttention(analysisAttention);
    if (analysisAttention !== 0) setUnlocking(true);
  }
  useEffect(() => {
    if (!unlocking) return;
    const id = window.setTimeout(() => setUnlocking(false), UNLOCK_WINDOW_MS);
    return () => window.clearTimeout(id);
  }, [unlocking]);

  const analysisActive = activeTab === 'analysis';
  // "Ready" mirrors the desktop CTA logic: reading present and the tab not
  // currently the active one — that's when we want the glow to invite a tap.
  const analysisReady = hasReading && !analysisActive;

  const tabs: TabSpec[] = [
    {
      key: 'selection',
      label: t.mobile.tabs.selection,
      icon: <Telescope className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: hasSelectedBody,
    },
    {
      key: 'display',
      label: t.mobile.tabs.display,
      icon: <Eye className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: true,
    },
    {
      key: 'navigation',
      label: t.mobile.tabs.navigation,
      icon: <Compass className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: true,
    },
    {
      key: 'analysis',
      label: t.mobile.tabs.analysis,
      icon: <LayoutDashboard className="size-4" strokeWidth={1.4} aria-hidden />,
      enabled: hasReading,
      locked: !hasReading,
    },
  ];

  return (
    <nav
      role="tablist"
      aria-label={t.mobile.cockpit.navAriaLabel}
      className="shrink-0 z-31
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
                ? 'text-cyan-100 bg-cyan-400/10'
                : 'text-slate-300/85 hover:text-slate-100 hover:bg-violet-500/10',
              isAnalysisTab && unlocking && 'animate-rail-unlock',
              isAnalysisTab && analysisReady && !unlocking && 'animate-cta-glow',
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
