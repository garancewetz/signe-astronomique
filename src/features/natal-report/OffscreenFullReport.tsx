import { forwardRef } from 'react';
import type { CelestialReading } from '@/features/astronomy';
import { FullReport } from './RightPanel';

/**
 * Off-screen mount of the full report. Positioned far off the viewport so
 * `html2canvas-pro` can rasterise it for the PDF export without ever painting
 * to the user's screen. The ref is what `useExportHandlers` reads.
 */
export const OffscreenFullReport = forwardRef<
  HTMLDivElement,
  { reading: CelestialReading }
>(function OffscreenFullReport({ reading }, ref) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-[-12000px] w-md
                 bg-surface-raised text-slate-200"
      ref={ref}
    >
      <FullReport reading={reading} />
    </div>
  );
});
