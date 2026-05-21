import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from './cn';

export type MenuRowKind = 'action' | 'toggle' | 'panel';
export type MenuRowSize = 'sm' | 'md' | 'lg';

interface MenuRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: MenuRowKind;
  size?: MenuRowSize;
  label: string;
  sublabel?: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  /** Render a padlock badge at the trailing end. Hidden when active. */
  locked?: boolean;
  /** Render a `>` chevron at the trailing end (for navigation rows). */
  chevron?: boolean;
}

interface SizeTokens {
  shell: string;
  label: string;
  pill: string;
  knob: string;
  knobLeft: string;
  knobRight: string;
}

const sizeTokens: Record<MenuRowSize, SizeTokens> = {
  sm: {
    shell: 'min-h-9 py-1.5 pl-2 pr-2.5',
    label: 'text-cockpit-lg tracking-tight',
    pill: 'w-7 h-3',
    knob: 'size-2.5',
    knobLeft: 'left-px',
    knobRight: 'left-[calc(100%-0.625rem-1px)]',
  },
  md: {
    shell: 'min-h-11 px-3 py-2',
    label: 'text-cockpit-md tracking-tight',
    pill: 'w-9 h-4',
    knob: 'size-3',
    knobLeft: 'left-px',
    knobRight: 'left-[calc(100%-0.75rem-1px)]',
  },
  lg: {
    shell: 'min-h-12 py-2 pl-2 pr-3',
    label: 'text-cockpit-md tracking-tight',
    pill: 'w-9 h-4',
    knob: 'size-3',
    knobLeft: 'left-px',
    knobRight: 'left-[calc(100%-0.75rem-1px)]',
  },
};

/**
 * Cockpit-styled list row used by the sidebar and the mobile sheets/drawers.
 * `kind` drives the ARIA semantics: `toggle` adds aria-pressed and a switch
 * pill, `panel` adds aria-pressed + aria-expanded for disclosure rows,
 * `action` is a plain push button. Caller supplies `aria-controls` via
 * standard prop spread when needed.
 */
export const MenuRow = forwardRef<HTMLButtonElement, MenuRowProps>(
  function MenuRow(
    {
      className,
      kind = 'action',
      size = 'md',
      label,
      sublabel,
      icon,
      active = false,
      locked = false,
      chevron = false,
      type = 'button',
      'aria-label': ariaLabelProp,
      ...rest
    },
    ref,
  ) {
    const s = sizeTokens[size];
    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabelProp ?? label}
        aria-pressed={kind !== 'action' ? active : undefined}
        aria-expanded={kind === 'panel' ? active : undefined}
        className={cn(
          'cockpit-focus relative w-full',
          'flex items-center gap-3 rounded',
          'transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          s.shell,
          active
            ? 'text-cyan-100 bg-cyan-400/10'
            : 'text-slate-200/90 hover:text-slate-50 hover:bg-violet-500/10',
          className,
        )}
        {...rest}
      >
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              'shrink-0 grid place-items-center w-5',
              active ? 'text-cyan-200' : 'text-slate-300/85',
            )}
          >
            {icon}
          </span>
        )}
        <span className="flex-1 min-w-0 text-left">
          <span
            className={cn(
              'block truncate',
              s.label,
              active ? 'text-cyan-50' : 'text-slate-100',
            )}
          >
            {label}
          </span>
          {sublabel && (
            <span className="block truncate text-cockpit-xs tracking-cockpit-tight uppercase text-slate-500">
              {sublabel}
            </span>
          )}
        </span>
        {kind === 'toggle' && (
          <span
            aria-hidden="true"
            className={cn(
              'shrink-0 relative inline-block rounded-full transition-colors',
              s.pill,
              active ? 'bg-cyan-400/60' : 'bg-slate-600/45',
            )}
          >
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-[left]',
                s.knob,
                active ? s.knobRight : s.knobLeft,
              )}
            />
          </span>
        )}
        {locked && !active && (
          <span
            aria-hidden="true"
            className="shrink-0 grid place-items-center
                       size-4 rounded-full
                       bg-violet-950/85 border border-violet-400/40"
          >
            <Lock className="size-[8px] text-violet-200/85" strokeWidth={2.5} />
          </span>
        )}
        {chevron && (
          <ChevronRight
            className="size-3.5 shrink-0 text-slate-500"
            strokeWidth={1.5}
            aria-hidden
          />
        )}
      </button>
    );
  },
);
