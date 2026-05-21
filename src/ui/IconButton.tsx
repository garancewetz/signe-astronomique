import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export type IconButtonSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconButtonTone = 'cockpit' | 'glass';
export type IconButtonActiveTone = 'cyan' | 'sky' | 'emerald';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  tone?: IconButtonTone;
  active?: boolean;
  activeTone?: IconButtonActiveTone;
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'size-7',
  md: 'size-8',
  lg: 'size-9',
  xl: 'size-10',
};

const toneShape: Record<IconButtonTone, string> = {
  cockpit: 'rounded',
  glass: 'rounded-md',
};

const toneInactive: Record<IconButtonTone, string> = {
  cockpit:
    'text-slate-300/85 hover:text-slate-100 hover:bg-violet-500/10 border-transparent',
  glass:
    'text-slate-300/85 hover:text-slate-50 bg-white/0 hover:bg-white/5 border-white/10 hover:border-white/20',
};

const activeToneClasses: Record<IconButtonActiveTone, string> = {
  cyan: 'text-cyan-100 bg-cyan-400/14 border-cyan-300/55',
  sky: 'text-sky-100 bg-sky-400/14 border-sky-300/55',
  emerald: 'text-emerald-100 bg-emerald-400/14 border-emerald-300/55',
};

/**
 * Square icon-only button with cockpit-chrome defaults. Replaces inline
 * `<button>` reimplementations across the sidebar, system dock and HUD
 * cards. Use `tone="glass"` inside translucent overlays (HudCard); the
 * default `tone="cockpit"` matches the dark sidebar surface.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      className,
      size = 'md',
      tone = 'cockpit',
      active = false,
      activeTone = 'cyan',
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'cockpit-focus grid place-items-center border transition-colors',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          sizeClasses[size],
          toneShape[tone],
          active ? activeToneClasses[activeTone] : toneInactive[tone],
          className,
        )}
        {...props}
      />
    );
  },
);
