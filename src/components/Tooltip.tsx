import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './ui';
import { usePortalTarget } from '../hooks/usePortalTarget';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipWrapProps {
  children: React.ReactNode;
  text: string;
  /** Side of the trigger the tooltip sits on. Defaults to 'top'. */
  placement?: TooltipPlacement;
  /** Hover delay before the tooltip appears, in ms. */
  delayMs?: number;
}

/**
 * Tooltip portal: floats fixed above any container so it isn't clipped
 * by `overflow-x` ancestors (the bottom console bar) and doesn't add a
 * second flex child next to the trigger. Positioned against the
 * trigger's bounding rect, recomputed on scroll/resize while open.
 *
 * `placement` controls which side of the trigger the tooltip sits on —
 * pick the side facing into the screen so it never spawns off-edge.
 */
export function TooltipWrap({
  children,
  text,
  placement = 'top',
  delayMs = 250,
}: TooltipWrapProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const portalTarget = usePortalTarget();

  const updatePos = () => {
    const el = wrapRef.current;
    if (!el) return;
    setPos(computePosition(el.getBoundingClientRect(), placement));
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onMove = () => updatePos();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
    // updatePos is recreated each render but reads from refs/state only;
    // including `placement` covers the only behavioural input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placement]);

  const showTooltip = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      updatePos();
      setOpen(true);
    }, delayMs);
  };

  const hideTooltip = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(false);
    setPos(null);
  };

  const tooltip =
    open &&
    pos &&
    portalTarget &&
    createPortal(
      <span
        aria-hidden="true"
        style={{ left: pos.left, top: pos.top }}
        className={cn(
          'pointer-events-none fixed z-100',
          translateClass(placement),
          'whitespace-normal max-w-[min(18rem,calc(100vw-2rem))] text-balance text-center',
          'bg-surface-raised/95 backdrop-blur-md',
          'border border-border-hud-strong rounded-md shadow-cockpit-modal',
          'px-2.5 py-1.5 text-cockpit-xs tracking-cockpit leading-snug',
          'text-slate-200',
        )}
      >
        {text}
      </span>,
      portalTarget,
    );

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {tooltip}
    </span>
  );
}

function computePosition(
  rect: DOMRect,
  placement: TooltipPlacement,
): { left: number; top: number } {
  const gap = 8;
  switch (placement) {
    case 'top':
      return { left: rect.left + rect.width / 2, top: rect.top - gap };
    case 'bottom':
      return { left: rect.left + rect.width / 2, top: rect.bottom + gap };
    case 'right':
      return { left: rect.right + gap, top: rect.top + rect.height / 2 };
    case 'left':
      return { left: rect.left - gap, top: rect.top + rect.height / 2 };
  }
}

function translateClass(placement: TooltipPlacement): string {
  switch (placement) {
    case 'top':
      return '-translate-x-1/2 -translate-y-full';
    case 'bottom':
      return '-translate-x-1/2';
    case 'right':
      return '-translate-y-1/2';
    case 'left':
      return '-translate-x-full -translate-y-1/2';
  }
}
