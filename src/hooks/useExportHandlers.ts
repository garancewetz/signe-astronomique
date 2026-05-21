import { useCallback, useState, type RefObject } from 'react';
import type { CelestialReading } from '@/features/astronomy';
import type { SpaceViewHandle } from '../components/space/SpaceView';
import {
  downloadCanvasPng,
  exportTargetedPdf,
  reportPdfFilename,
  viewFilename,
} from '../utils/exportReport';

interface UseExportHandlersArgs {
  spaceViewRef: RefObject<SpaceViewHandle | null>;
  fullReportRef: RefObject<HTMLDivElement | null>;
  reading: CelestialReading | null;
}

export interface ExportHandlers {
  exportingView: boolean;
  exportingPdf: boolean;
  handleExportView: () => Promise<void>;
  handleExportPdf: () => Promise<void>;
}

/**
 * Encapsulates the two exports: canvas-only PNG "view" (sky 3D only) and
 * the multi-page A4 PDF (sky cover + full report). Each flow has its own
 * busy flag so the UI can disable the triggering button while a capture is
 * in flight.
 */
export function useExportHandlers({
  spaceViewRef,
  fullReportRef,
  reading,
}: UseExportHandlersArgs): ExportHandlers {
  const [exportingView, setExportingView] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

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

  const handleExportPdf = useCallback(async () => {
    if (!reading) return;
    const spaceCanvas = spaceViewRef.current?.captureCanvas();
    const reportEl = fullReportRef.current;
    if (!spaceCanvas || !reportEl) return;
    setExportingPdf(true);
    try {
      await exportTargetedPdf(
        spaceCanvas,
        reportEl,
        reportPdfFilename(reading.input.date, reading.input.placeLabel),
      );
    } catch (err) {
      console.error('Export PDF error', err);
    } finally {
      setExportingPdf(false);
    }
  }, [reading, spaceViewRef, fullReportRef]);

  return {
    exportingView,
    exportingPdf,
    handleExportView,
    handleExportPdf,
  };
}
