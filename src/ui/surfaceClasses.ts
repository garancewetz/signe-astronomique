export type SurfaceTone = 'console' | 'panel' | 'sheet';

// Each tone bakes the bg + backdrop-blur + border-color + shadow combo that
// recurs across the cockpit chrome. Border *direction* and corner *radius*
// are intentionally left to the caller — DockedPanel wants `rounded-r-sm`
// and `border-l-0`, the sidebar wants `border-r` only, etc. Override via
// className; tailwind-merge resolves the conflicts.
const toneClasses: Record<SurfaceTone, string> = {
  console:
    'bg-surface-console/55 backdrop-blur-xl border border-border-hud-subtle shadow-cockpit-panel',
  panel:
    'bg-surface-raised/95 backdrop-blur-2xl border border-border-control shadow-cockpit-panel',
  sheet:
    'bg-surface-raised/98 backdrop-blur-xl border border-border-hud-strong shadow-cockpit-sheet',
};

/**
 * Returns the cockpit-chrome class string for a surface tone. Use this for
 * motion components or any element where rendering the `<Surface>` wrapper
 * is awkward (e.g. `motion.aside` with custom transitions).
 */
export function surfaceClasses(tone: SurfaceTone): string {
  return toneClasses[tone];
}
