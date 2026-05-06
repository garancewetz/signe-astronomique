import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface UIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  solid:
    'border-border-control bg-violet-600/15 text-white hover:bg-violet-600/25 hover:border-accent-label',
  outline:
    'border-border-control bg-transparent text-slate-200 hover:border-accent-label hover:bg-violet-500/10 hover:text-white',
  ghost:
    'border-transparent bg-transparent text-slate-300 hover:border-border-hud hover:bg-violet-500/10 hover:text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-2.5 text-cockpit-sm tracking-cockpit-wide',
  md: 'h-10 px-4 text-cockpit-sm tracking-cockpit',
  lg: 'min-h-11 px-6 py-2.5 text-xs tracking-cockpit',
};

export const Button = forwardRef<HTMLButtonElement, UIButtonProps>(function Button(
  { className, variant = 'outline', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'cockpit-focus inline-flex items-center justify-center gap-2 rounded-panel border transition-all disabled:cursor-not-allowed disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
