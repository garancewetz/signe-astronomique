import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from './cn';

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
  closeContent = <DefaultCloseIcon />,
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
          'flex items-start justify-between gap-2 px-4 py-3 border-b border-violet-400/25',
          headerClassName,
        )}
      >
        <div className="min-w-0">
          {subtitle && (
            <div className={cn('text-[10px] tracking-[0.28em] text-violet-300 mb-0.5', subtitleClassName)}>
              {subtitle}
            </div>
          )}
          <h2 className={cn('text-[12.5px] tracking-[0.16em] text-violet-50', titleClassName)}>
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

function DefaultCloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0" aria-hidden>
      <path d="M5 5l8 8M13 5l-8 8" strokeLinecap="round" />
    </svg>
  );
}
