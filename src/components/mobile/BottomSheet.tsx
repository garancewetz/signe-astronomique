import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useMemo, type ReactNode } from 'react';
import { cn } from '../ui';

export type SheetSnap = 'peek' | 'mid' | 'full';

interface BottomSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;

  /** Visible height (px) at each snap point. */
  peekPx: number;
  midPx: number;
  fullPx: number;

  /**
   * Distance from the viewport bottom to the bottom edge of the sheet,
   * as any CSS length. Use this to clear a fixed tab bar / safe area.
   */
  bottomOffset?: string;

  ariaLabel?: string;
  children: ReactNode;
}

/**
 * Draggable bottom sheet with 3 snap points (peek / mid / full).
 *
 * The sheet is rendered at its full height, then translated downward to
 * reveal only the requested snap height. Dragging is gated to the handle
 * region so the body content can scroll independently when at full snap.
 *
 * The component is controlled — the parent owns `snap` and reacts to
 * `onSnapChange` (fired after drag-release / fling). External changes to
 * `snap` animate the sheet to the new target.
 */
export function BottomSheet({
  snap,
  onSnapChange,
  peekPx,
  midPx,
  fullPx,
  bottomOffset = '0px',
  ariaLabel = 'Console',
  children,
}: BottomSheetProps) {
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  // translateY values for each snap. y=0 means fully open; positive y
  // pushes the top of the sheet down, exposing less content.
  const targets = useMemo(
    () => ({
      full: 0,
      mid: Math.max(0, fullPx - midPx),
      peek: Math.max(0, fullPx - peekPx),
    }),
    [fullPx, midPx, peekPx],
  );

  // Match the initial snap on mount so the sheet doesn't flash fully open
  // before the animation effect runs.
  const y = useMotionValue(targets[snap]);

  useEffect(() => {
    const t = targets[snap];
    if (reduceMotion) {
      y.set(t);
      return;
    }
    const controls = animate(y, t, {
      type: 'spring',
      stiffness: 320,
      damping: 34,
      mass: 0.6,
    });
    return () => controls.stop();
  }, [snap, targets, reduceMotion, y]);

  return (
    <motion.aside
      role="region"
      aria-label={ariaLabel}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: targets.full, bottom: targets.peek }}
      dragElastic={{ top: 0.02, bottom: 0.06 }}
      dragMomentum={false}
      onDragEnd={(_e, info) => {
        const projected = y.get() + info.velocity.y * 0.18;
        const candidates: Array<[SheetSnap, number]> = [
          ['full', targets.full],
          ['mid', targets.mid],
          ['peek', targets.peek],
        ];
        let nearest: SheetSnap = 'peek';
        let bestDist = Infinity;
        for (const [name, val] of candidates) {
          const d = Math.abs(projected - val);
          if (d < bestDist) {
            nearest = name;
            bestDist = d;
          }
        }
        onSnapChange(nearest);
      }}
      style={{ y, height: fullPx, bottom: bottomOffset }}
      className={cn(
        'fixed left-0 right-0 z-30',
        'bg-surface-console/95 backdrop-blur-2xl',
        'border-t border-border-hud-subtle',
        'rounded-t-xl',
        'shadow-cockpit-panel',
        'flex flex-col',
      )}
    >
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        onClick={() => {
          // Tap on handle cycles peek → mid → full → peek
          const next: SheetSnap =
            snap === 'peek' ? 'mid' : snap === 'mid' ? 'full' : 'peek';
          onSnapChange(next);
        }}
        aria-label={
          snap === 'full'
            ? 'Replier la console'
            : snap === 'mid'
              ? 'Étendre la console'
              : 'Ouvrir la console'
        }
        aria-expanded={snap !== 'peek'}
        className="cockpit-focus shrink-0 touch-none select-none
                   cursor-grab active:cursor-grabbing
                   flex items-center justify-center pt-2 pb-1.5"
      >
        <span
          aria-hidden="true"
          className="block w-10 h-1 rounded-full bg-slate-400/45"
        />
      </button>

      <div
        className={cn(
          'flex-1 min-h-0',
          snap === 'peek'
            ? 'overflow-hidden'
            : 'overflow-y-auto overscroll-contain',
        )}
      >
        {children}
      </div>
    </motion.aside>
  );
}
