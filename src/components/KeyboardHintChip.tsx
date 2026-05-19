import { Keyboard } from 'lucide-react';
import { cn } from './ui/cn';
import { useT } from '../context/useLocale';

interface KeyboardHintChipProps {
  /**
   * Called when the user clicks the chip — wires to opening the legend
   * panel on the keyboard-shortcuts section so the user gets the full
   * binding table without re-discovering the sidebar.
   */
  onOpen: () => void;
  /** Hidden while the legend is already showing, to avoid duplicate chrome. */
  hidden?: boolean;
}

/**
 * Discreet bottom-right chip that surfaces the existence of keyboard
 * navigation on the 3D view. Click to open the legend panel scrolled to
 * the shortcuts section. Desktop-only — keyboards aren't relevant on
 * mobile, where the caller should simply not render this.
 */
export function KeyboardHintChip({ onOpen, hidden = false }: KeyboardHintChipProps) {
  const t = useT();
  if (hidden) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t.keyboardShortcuts.chipAriaLabel}
      className={cn(
        'cockpit-focus pointer-events-auto',
        'absolute bottom-3 right-3 z-20',
        'inline-flex items-center gap-1.5',
        'px-2 py-1 rounded-md',
        'border border-border-hud-subtle bg-surface-console/55 backdrop-blur-sm',
        'text-cockpit-xs tracking-cockpit-label uppercase',
        'text-slate-400/85 hover:text-slate-100 hover:bg-surface-console/85',
        'opacity-60 hover:opacity-100',
        'transition-[opacity,color,background-color]',
      )}
    >
      <Keyboard className="size-3" strokeWidth={1.6} aria-hidden />
      <span aria-hidden="true">← → · A/E · Z/S</span>
      <span className="sr-only">{t.keyboardShortcuts.chipLabel}</span>
    </button>
  );
}
