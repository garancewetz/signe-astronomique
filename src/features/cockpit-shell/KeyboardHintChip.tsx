import { useEffect, useId, useRef, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { cn } from '@/ui/cn';
import { useT } from '@/context/useLocale';

/**
 * Discreet bottom-right chip that surfaces the keyboard navigation of the
 * 3D view. Clicking it opens just the shortcuts, right above it — not the
 * whole legend, where they sat at the very end. Desktop-only: keyboards
 * aren't relevant on mobile, where the caller simply doesn't render it.
 */
export function KeyboardHintChip() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="pointer-events-auto absolute bottom-3 right-3 z-30">
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t.keyboardShortcuts.sectionLabel}
          className="absolute z-30 bottom-full right-0 mb-2 w-72 p-3 rounded-md
                     border border-border-hud-subtle bg-surface-console/95 backdrop-blur-sm
                     shadow-cockpit-panel"
        >
          <p className="pb-2 text-cockpit-md font-medium text-slate-100">
            {t.keyboardShortcuts.sectionLabel}
          </p>
          <dl className="space-y-1.5">
            {t.keyboardShortcuts.rows.map((row) => (
              <div key={row.keys} className="flex items-baseline justify-between gap-3">
                <dt>
                  <kbd className="px-1.5 py-0.5 rounded border border-border-hud-subtle
                                  font-mono text-cockpit-sm text-slate-200">
                    {row.keys}
                  </kbd>
                </dt>
                <dd className="text-right text-cockpit-sm text-slate-300">{row.desc}</dd>
              </div>
            ))}
          </dl>
          <p className="pt-2 mt-2 border-t border-border-hud-faint text-cockpit-sm leading-snug text-slate-400">
            {t.keyboardShortcuts.sideViewNote}
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t.keyboardShortcuts.chipAriaLabel}
        className={cn(
          'cockpit-focus inline-flex items-center gap-1.5',
          'px-2 py-1 rounded-md',
          'border border-border-hud-subtle bg-surface-console/55 backdrop-blur-sm',
          'text-cockpit-sm transition-[opacity,color,background-color]',
          open
            ? 'text-slate-100 bg-surface-console/85 opacity-100'
            : 'text-slate-400 opacity-60 hover:opacity-100 hover:text-slate-100 hover:bg-surface-console/85',
        )}
      >
        <Keyboard className="size-3" strokeWidth={1.6} aria-hidden />
        <span>{t.keyboardShortcuts.chipLabel}</span>
      </button>
    </div>
  );
}
