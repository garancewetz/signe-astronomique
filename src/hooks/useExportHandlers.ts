import { useCallback, useState, type RefObject } from 'react';
import type { CelestialReading } from '../utils/astroEngine';
import type { SpaceViewHandle } from '../components/space/SpaceView';
import {
  downloadCanvasPng,
  exportTargetedPng,
  reportFilename,
  viewFilename,
} from '../utils/exportReport';

interface UseExportHandlersArgs {
  spaceViewRef: RefObject<SpaceViewHandle | null>;
  fullReportRef: RefObject<HTMLDivElement | null>;
  reading: CelestialReading | null;
}

export interface ExportHandlers {
  exporting: boolean;
  exportingView: boolean;
  handleExport: () => Promise<void>;
  handleExportView: () => Promise<void>;
}

/**
 * Encapsulates the two PNG exports (the canvas-only "view" and the bundled
 * "view + report"). Both flows share a busy flag so the UI can disable the
 * triggering buttons while a capture is in flight.
 */
export function useExportHandlers({
  spaceViewRef,
  fullReportRef,
  reading,
}: UseExportHandlersArgs): ExportHandlers {
  const [exporting, setExporting] = useState(false);
  const [exportingView, setExportingView] = useState(false);

  const handleExport = useCallback(async () => {
    if (!reading) return;
    const spaceCanvas = spaceViewRef.current?.captureCanvas();
    const reportEl = fullReportRef.current;
    if (!spaceCanvas || !reportEl) return;
    setExporting(true);
    try {
      await exportTargetedPng(
        spaceCanvas,
        reportEl,
        reportFilename(reading.input.date, reading.input.placeLabel),
      );
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setExporting(false);
    }
  }, [reading, spaceViewRef, fullReportRef]);

  const handleExportView = useCallback(async () => {
    const canvas = spaceViewRef.current?.captureCanvas();
    if (!canvas) return;
    setExportingView(true);
    try {
      await downloadCanvasPng(
        canvas,
        viewFilename(reading?.input.date ?? null, reading?.input.placeLabel),
      );
    } catch (err) {
      console.error('Export vue error', err);
    } finally {
      setExportingView(false);
    }
  }, [reading, spaceViewRef]);

  return { exporting, exportingView, handleExport, handleExportView };
}
