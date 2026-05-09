import type { CSSProperties, ReactNode } from 'react';
import { cn, MenuRow } from '../ui';
import type { ReportPanelKey, SidebarPanelKey } from './types';

type ItemKind = 'action' | 'toggle' | 'panel';

interface ItemProps {
  kind: ItemKind;
  label: string;
  sublabel?: string;
  ariaLabel?: string;
  icon: ReactNode;
  active?: boolean;
  locked?: boolean;
  unlocking?: boolean;
  unlockIndex?: number;
  disabled?: boolean;
  collapsed: boolean;
  onClick: () => void;
  ariaControls?: string;
}

export function SidebarItem({
  kind,
  label,
  sublabel,
  ariaLabel,
  icon,
  active = false,
  locked = false,
  unlocking = false,
  unlockIndex = 0,
  disabled = false,
  collapsed,
  onClick,
  ariaControls,
}: ItemProps) {
  // Collapsed mode hides the whole row; section icons are the only entry
  // points to inline items, so we render nothing here.
  if (collapsed) return null;

  const tooltip =
    locked && !active ? `${label} — verrouillé · ouvre COORDONNÉES` : label;

  // CSS custom property staggers the unlock cascade animation across the
  // ANALYSE rows; --rail-index is read by `animate-rail-unlock` keyframes.
  const unlockStyle: CSSProperties | undefined = unlocking
    ? ({ '--rail-index': unlockIndex } as CSSProperties)
    : undefined;

  return (
    <li className="relative">
      <MenuRow
        kind={kind}
        size="sm"
        label={label}
        sublabel={sublabel}
        icon={icon}
        active={active}
        locked={locked}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel ?? tooltip}
        aria-controls={ariaControls}
        data-locked={locked || undefined}
        data-unlocking={unlocking || undefined}
        style={unlockStyle}
        className={cn(
          'duration-200',
          locked && !active && 'animate-rail-breathe',
          unlocking && !locked && 'animate-rail-unlock',
        )}
      />
      {/* Active beam — cyan line on the right edge of the item. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-1 -right-2 w-px bg-cyan-300',
          'transition-opacity duration-200',
          'shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
    </li>
  );
}

interface AnalysisItemProps {
  panelKey: ReportPanelKey;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  unlockIndex: number;
  activePanel: SidebarPanelKey | null;
  onTogglePanel: (key: SidebarPanelKey) => void;
  hasReading: boolean;
  unlocking: boolean;
  collapsed: boolean;
}

/** Shared lock/unlock state for the report panel rows. */
export function AnalysisItem({
  panelKey,
  label,
  sublabel,
  icon,
  unlockIndex,
  activePanel,
  onTogglePanel,
  hasReading,
  unlocking,
  collapsed,
}: AnalysisItemProps) {
  return (
    <SidebarItem
      kind="panel"
      label={label}
      sublabel={sublabel}
      icon={icon}
      active={activePanel === panelKey}
      locked={!hasReading}
      unlocking={unlocking}
      unlockIndex={unlockIndex}
      collapsed={collapsed}
      onClick={() => onTogglePanel(panelKey)}
      ariaControls={`panel-${panelKey}`}
    />
  );
}
