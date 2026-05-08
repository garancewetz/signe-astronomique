import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from './cn';
import { X } from 'lucide-react';

interface PanelShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  closeAriaLabel?: string;
  closeContent?: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  bodyClassName?: string;
  closeButtonClassName?: string;
  footer?: ReactNode;
  animated?: boolean;
  animationKey?: string;
}

export function PanelShell({
  title,
  subtitle,
  children,
  onClose,
  closeAriaLabel = 'Fermer le panneau',
  closeContent = <X className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden />,
  className,
  headerClassName,
  titleClassName,
  subtitleClassName,
  bodyClassName,
  closeButtonClassName,
  footer,
  animated = true,
  animationKey,
}: PanelShellProps) {
  const reduceMotion = useReducedMotion();
  const content = animated ? (
    <motion.div
      key={animationKey}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className={cn('flex-1 min-h-0', bodyClassName)}
    >
      {children}
    </motion.div>
  ) : (
    <div className={cn('flex-1 min-h-0', bodyClassName)}>{children}</div>
  );

  return (
    <div className={cn('h-full flex flex-col', className)}>
      <header
        className={cn(
          'flex items-start justify-between gap-2 px-4 py-3 border-b border-border-hud',
          headerClassName,
        )}
      >
        <div className="min-w-0">
          {subtitle && (
            <div
              className={cn(
                'text-cockpit-sm tracking-cockpit-label text-accent-label mb-0.5',
                subtitleClassName,
              )}
            >
              {subtitle}
            </div>
          )}
          <h2
            className={cn(
              'text-cockpit-lg tracking-cockpit-tight text-accent-title',
              titleClassName,
            )}
          >
            {title}
          </h2>
        </div>
        {onClose && (
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className={cn('shrink-0', closeButtonClassName)}
            aria-label={closeAriaLabel}
          >
            {closeContent}
          </Button>
        )}
      </header>

      {content}
      {footer}
    </div>
  );
}
