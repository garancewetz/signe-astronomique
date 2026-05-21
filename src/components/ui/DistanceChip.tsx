interface DistanceChipProps {
  /** Pre-formatted text. Component renders nothing when null/empty. */
  label: string | null;
}

/**
 * Small glassmorphic readout pinned to the top-right of the canvas area —
 * used by both the desktop and mobile cockpits for the live camera-altitude
 * HUD. Pointer-events disabled: it's purely informational and must never
 * intercept clicks meant for the 3D scene.
 *
 * Positioning (top-3 right-3, z-20) lives here rather than at call sites so
 * the two cockpits stay in sync if we ever move it.
 */
export function DistanceChip({ label }: DistanceChipProps) {
  if (!label) return null;
  return (
    <div
      aria-live="off"
      className="pointer-events-none absolute top-3 right-3 z-20
                 px-2 py-1 rounded-md
                 border border-border-hud-subtle bg-surface-console/55
                 backdrop-blur-sm
                 text-cockpit-xs tracking-cockpit-label uppercase
                 text-slate-200 tabular-nums"
    >
      {label}
    </div>
  );
}
