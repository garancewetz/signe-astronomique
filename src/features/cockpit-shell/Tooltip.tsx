import { useState } from 'react';
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { cn } from '@/ui';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipWrapProps {
  children: React.ReactNode;
  text: string;
  /** Preferred side of the trigger; floating-ui flips if it doesn't fit. */
  placement?: TooltipPlacement;
  /** Hover delay before the tooltip appears, in ms. */
  delayMs?: number;
}

/**
 * Tooltip portal driven by @floating-ui/react. The `flip` and `shift`
 * middlewares keep the tooltip inside the viewport even when the
 * preferred side would clip — replaces our earlier hand-rolled
 * positioning logic that occasionally ran off-screen.
 */
export function TooltipWrap({
  children,
  text,
  placement = 'top',
  delayMs = 250,
}: TooltipWrapProps) {
  const [open, setOpen] = useState(false);

  const {
    refs: { setReference, setFloating },
    floatingStyles,
    context,
  } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { delay: { open: delayMs, close: 0 } });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <span
        ref={setReference}
        className="inline-flex shrink-0"
        {...getReferenceProps()}
      >
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <span
            ref={setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={cn(
              'pointer-events-none z-100',
              'whitespace-normal max-w-[min(18rem,calc(100vw-2rem))]',
              'text-balance text-center',
              'bg-surface-raised/95 backdrop-blur-md',
              'border border-border-hud-strong rounded-md shadow-cockpit-modal',
              'px-2.5 py-1.5 text-cockpit-xs tracking-cockpit leading-snug',
              'text-slate-200',
            )}
          >
            {text}
          </span>
        </FloatingPortal>
      )}
    </>
  );
}
