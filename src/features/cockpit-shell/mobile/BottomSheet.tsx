import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton, cn } from '@/ui';
import { useT } from '@/context/useLocale';

export type SheetSnap = 'peek' | 'mid' | 'full';

// Initial estimate for the drag handle's rendered height (pt-2 + h-1 +
// pb-1.5 ≈ 18, rounded up to absorb the button's flex centering). Used
// only for the first frame — ResizeObserver replaces it once mounted.
const HANDLE_FALLBACK_PX = 28;

function nextSnapForTap(
  snap: SheetSnap,
  targets: Record<SheetSnap, number>,
): SheetSnap {
  // When content fits inside mid, the mid target collapses onto peek or
  // full; skipping it keeps every tap visibly moving.
  const midEqualsPeek = targets.mid === targets.peek;
  const midEqualsFull = targets.mid === targets.full;
  if (snap === 'peek') return midEqualsPeek || midEqualsFull ? 'full' : 'mid';
  if (snap === 'mid') return midEqualsFull ? 'peek' : 'full';
  return 'peek';
}

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

  /**
   * Optional handler for an explicit close button shown next to the drag
   * handle when the sheet is expanded past peek. Parents typically snap
   * back to peek and clear any active tab / contextual content.
   */
  onClose?: () => void;

  /**
   * When false, the sheet stays mounted (preserving its measured layout)
   * but slides fully below the viewport. This avoids the remount glitch
   * where naturalContentPx is null on the first frame and the sheet
   * snaps from an unbounded fullPx position to its real target.
   */
  visible?: boolean;

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
 *
 * Close affordances (two paradigms, on purpose):
 *   - `onClose` + the visible X button — the canonical, discoverable close.
 *     Rendered whenever `onClose` is provided, regardless of snap, so the
 *     dismiss action stays reachable even at peek. The parent is expected
 *     to omit `onClose` when there's nothing contextual to clear (e.g. the
 *     first-arrival CTA home).
 *   - Tapping the drag handle — a power-user shortcut that cycles snaps
 *     (peek → mid → full → peek). Kept because it preserves the
 *     bottom-sheet gesture vocabulary users already know. No-op when the
 *     content fits in peek (`canExpand` is false).
 */
export function BottomSheet({
  snap,
  onSnapChange,
  peekPx,
  midPx,
  fullPx,
  bottomOffset = '0px',
  onClose,
  visible = true,
  ariaLabel,
  children,
}: BottomSheetProps) {
  const t = useT();
  const resolvedAriaLabel = ariaLabel ?? t.mobile.bottomSheet.defaultAriaLabel;
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  const handleRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [naturalContentPx, setNaturalContentPx] = useState<number | null>(null);
  const [handlePx, setHandlePx] = useState(HANDLE_FALLBACK_PX);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => {
      setNaturalContentPx(content.offsetHeight);
      if (handleRef.current) setHandlePx(handleRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    if (handleRef.current) ro.observe(handleRef.current);
    return () => ro.disconnect();
  }, []);

  // Cap full/mid to the content's natural height so an expanded sheet
  // doesn't leave a big empty band when the active tab's content is short.
  const effectiveFullPx = useMemo(() => {
    if (naturalContentPx == null) return fullPx;
    return Math.min(fullPx, Math.max(peekPx, naturalContentPx + handlePx));
  }, [fullPx, naturalContentPx, handlePx, peekPx]);

  const effectiveMidPx = useMemo(
    () => Math.min(midPx, effectiveFullPx),
    [midPx, effectiveFullPx],
  );

  // When the content fits inside the peek height, full/mid collapse onto
  // peek and the sheet can't actually expand. Toggling snap state in that
  // case would only flash the close-X on and off without moving the sheet
  // — so we treat the handle as a no-op and hide the X entirely.
  const canExpand = effectiveFullPx > peekPx;

  // translateY values for each snap. y=0 means fully open; positive y
  // pushes the top of the sheet down, exposing less content. The off-screen
  // value tucks the sheet entirely below the tab bar plus any safe-area
  // inset so toggling `visible` slides it cleanly out of view.
  const hiddenPx = effectiveFullPx + 80;
  const targets = useMemo(
    () => ({
      full: 0,
      mid: Math.max(0, effectiveFullPx - effectiveMidPx),
      peek: Math.max(0, effectiveFullPx - peekPx),
    }),
    [effectiveFullPx, effectiveMidPx, peekPx],
  );

  // Match the initial visibility/snap on mount so the sheet doesn't flash
  // before the animation effect runs.
  const y = useMotionValue(visible ? targets[snap] : hiddenPx);

  useEffect(() => {
    const t = visible ? targets[snap] : hiddenPx;
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
  }, [snap, targets, reduceMotion, y, visible, hiddenPx]);

  return (
    <motion.aside
      role="region"
      aria-label={resolvedAriaLabel}
      aria-hidden={!visible}
      drag={visible ? 'y' : false}
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
      style={{ y, height: effectiveFullPx, bottom: bottomOffset }}
      className={cn(
        'fixed left-0 right-0 z-30',
        'bg-surface-console/95 backdrop-blur-2xl',
        'border-t border-border-hud-subtle',
        'rounded-t-xl',
        'shadow-cockpit-panel',
        'flex flex-col',
        !visible && 'pointer-events-none',
      )}
    >
      <div className="relative shrink-0">
        <button
          ref={handleRef}
          type="button"
          onPointerDown={canExpand ? (e) => dragControls.start(e) : undefined}
          onClick={
            canExpand
              ? () => onSnapChange(nextSnapForTap(snap, targets))
              : undefined
          }
          aria-label={
            snap === 'full'
              ? t.mobile.bottomSheet.collapseAriaLabel
              : snap === 'mid'
                ? t.mobile.bottomSheet.expandAriaLabel
                : t.mobile.bottomSheet.openAriaLabel
          }
          aria-expanded={snap !== 'peek'}
          aria-disabled={!canExpand}
          className={cn(
            'cockpit-focus w-full touch-none select-none',
            'flex items-center justify-center pt-2 pb-1.5',
            canExpand ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
          )}
        >
          <span
            aria-hidden="true"
            className="block w-10 h-1 rounded-full bg-slate-400/45"
          />
        </button>
        {onClose && (
          <IconButton
            onClick={onClose}
            aria-label={t.mobile.bottomSheet.closeAriaLabel}
            className="absolute top-1 right-1 active:bg-violet-500/15"
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden />
          </IconButton>
        )}
      </div>

      <div
        className={cn(
          'flex-1 min-h-0',
          snap === 'peek'
            ? 'overflow-hidden'
            : 'overflow-y-auto overscroll-contain',
        )}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </motion.aside>
  );
}
