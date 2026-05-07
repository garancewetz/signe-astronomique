import type { ReactNode } from 'react';
import { TooltipWrap } from './Tooltip';
import { cn } from './ui';

interface RailButtonProps {
  /** Inside-edge of the rail. Drives both the active glow line and the
   *  tooltip placement (tooltip sits on the canvas-facing side). */
  side: 'left' | 'right';
  active?: boolean;
  onClick: () => void;
  icon: ReactNode;
  /** Accessible name + tooltip text. */
  label: string;
  ariaControls?: string;
  ariaExpanded?: boolean;
}

/**
 * Icon-only button used by Left/Right rails. Renders a thin cyan glow
 * line on the rail's inside edge when active — the only piece of UI
 * that breaks the deep-space purple to act as a directional cue.
 */
export function RailButton({
  side,
  active = false,
  onClick,
  icon,
  label,
  ariaControls,
  ariaExpanded,
}: RailButtonProps) {
  return (
    <TooltipWrap text={label} placement={side === 'left' ? 'right' : 'left'}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        aria-controls={ariaControls}
        aria-expanded={ariaExpanded}
        className={cn(
          'cockpit-focus relative grid place-items-center',
          'h-11 w-11 rounded-md transition-colors duration-200',
          active
            ? 'text-cyan-100 bg-cyan-400/8'
            : 'text-slate-300/85 hover:text-slate-100 hover:bg-violet-500/10',
        )}
      >
        <span aria-hidden="true">{icon}</span>
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-1.5 w-px bg-cyan-300',
            'transition-opacity duration-200',
            'shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]',
            side === 'left' ? '-right-px' : '-left-px',
            active ? 'opacity-100' : 'opacity-0',
          )}
        />
      </button>
    </TooltipWrap>
  );
}
