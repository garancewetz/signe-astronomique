import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from './cn';
import { surfaceClasses } from './surfaceClasses';

interface DockedPanelProps {
  open: boolean;
  /** Distance in px from the viewport's left edge — the panel anchors flush against it. */
  sidebarWidth: number;
  /** CSS width value (px / clamp / calc) for the dock itself. */
  dockWidth: string;
  panelId: string;
  children: ReactNode;
}

/**
 * Animated slide-out aside that docks to the right of a left-side rail.
 * Slides in horizontally; respects reduced-motion. The chrome reuses the
 * `panel` Surface tone with two overrides — left edge borderless and only
 * the right corners rounded, so the panel reads as continuous with the
 * sidebar it docks against.
 */
export function DockedPanel({
  open,
  sidebarWidth,
  dockWidth,
  panelId,
  children,
}: DockedPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      id={panelId}
      initial={false}
      animate={{ x: open ? '0%' : '-100%', opacity: open ? 1 : 0 }}
      transition={
        reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 32 }
      }
      aria-hidden={!open}
      className={cn(
        'absolute top-11 z-25 bottom-[env(safe-area-inset-bottom,0)]',
        surfaceClasses('panel'),
        'border-l-0 rounded-r-sm',
      )}
      style={{
        width: dockWidth,
        left: `${sidebarWidth}px`,
      }}
    >
      <div className="h-full min-h-0 overflow-hidden flex flex-col">{children}</div>
    </motion.aside>
  );
}
