interface DistanceChipProps {
  /** Pre-formatted text. Component renders nothing when null/empty. */
  label: string | null;
  /** Corner of the canvas: top-right (mobile) or bottom-right, above the
   *  keyboard chip (desktop, where the top banner takes the top). */
  placement?: 'top-right' | 'bottom-right';
}

/**
 * Small glassmorphic readout pinned to the top-right of the canvas area —
 * used by both the desktop and mobile cockpits for the live camera-altitude
 * HUD. Pointer-events disabled: it's purely informational and must never
 * intercept clicks meant for the 3D scene.
 *
 * Positioning (right edge, z-20) lives here rather than at call sites so
 * the two cockpits stay in sync; `placement` only picks the corner.
 */
export function DistanceChip({ label, placement = 'top-right' }: DistanceChipProps) {
  if (!label) return null;
  return (
    <div
      aria-live="off"
      className={`pointer-events-none absolute right-3 z-20 ${placement === 'top-right' ? 'top-3' : 'bottom-12'}
                 px-2 py-1 rounded-md
                 border border-border-hud-subtle bg-surface-console/55
                 backdrop-blur-sm
                 text-cockpit-sm text-slate-300 tabular-nums`}
    >
      {label}
    </div>
  );
}
