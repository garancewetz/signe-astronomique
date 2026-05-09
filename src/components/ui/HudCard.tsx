import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from './cn';
import { IconButton } from './IconButton';

export type HudCardVariant = 'floating' | 'inline';

interface HudCardProps {
  /**
   * `floating` (default): absolute-positioned glassmorphism card anchored
   * to the left of the sky map, with slide+fade entry animation. `inline`:
   * static block with the same chrome but no positioning, animation, or
   * outer glass surface — suitable for embedding (e.g. inside a mobile
   * bottom sheet).
   */
  variant?: HudCardVariant;
  /** Distance in px from the left edge to the floating card. Required when `variant === 'floating'`. */
  sidebarWidth?: number;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  closeAriaLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Glassmorphism HUD card used for left-anchored floating overlays
 * (selected body, legend, …). Auto height, fixed 340 px width,
 * blurred translucent background, slide-in animation, optional footer.
 */
export function HudCard({
  variant = 'floating',
  sidebarWidth = 0,
  title,
  subtitle,
  onClose,
  closeAriaLabel,
  children,
  footer,
}: HudCardProps) {
  const reduceMotion = useReducedMotion();
  const inner = (
    <>
      <header className="flex items-start gap-3 px-4 pt-3.5 pb-3 border-b border-white/5">
        <div className="min-w-0 flex-1">
          {subtitle && (
            <div className="text-cockpit-xs tracking-cockpit-caps text-accent-label/80 mb-0.5">
              {subtitle}
            </div>
          )}
          <h2 className="text-cockpit-md tracking-wide text-slate-100 truncate">
            {title}
          </h2>
        </div>
        <IconButton
          size="sm"
          tone="glass"
          onClick={onClose}
          aria-label={closeAriaLabel}
          className="shrink-0"
        >
          <X className="size-3.5" strokeWidth={1.4} aria-hidden />
        </IconButton>
      </header>

      <div className="overflow-y-auto px-4 py-3.5 space-y-3.5">{children}</div>

      {footer && (
        <footer className="border-t border-white/5 px-4 py-3">{footer}</footer>
      )}
    </>
  );

  if (variant === 'inline') {
    return (
      <section role="dialog" aria-label={closeAriaLabel} className="flex flex-col">
        {inner}
      </section>
    );
  }

  return (
    <motion.aside
      role="dialog"
      aria-label={closeAriaLabel}
      initial={reduceMotion ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'absolute z-25 w-[340px] max-h-[calc(100vh-96px)]',
        'flex flex-col overflow-hidden pointer-events-auto',
        'rounded-xl border border-white/10',
        'bg-[rgba(15,15,25,0.7)] backdrop-blur-md',
        'shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]',
      )}
      style={{ left: sidebarWidth + 20, top: 64 }}
    >
      {inner}
    </motion.aside>
  );
}
