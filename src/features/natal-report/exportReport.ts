import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

/**
 * A4 portrait PDF: the sky view fills the first page as a cover, then the
 * full report flows across subsequent pages. The report image is sliced
 * canvas-side so each PDF page gets a clean chunk (no half-cut lines of text
 * across page breaks beyond what natural pagination produces).
 *
 * Prerequisite: the Cesium canvas must have been created with
 * `preserveDrawingBuffer: true` (cf. SpaceView), otherwise the buffer is
 * empty when read. For the same reason we ask SpaceView to force a
 * synchronous `viewer.render()` before handing us the canvas.
 */
export async function exportTargetedPdf(
  spaceCanvas: HTMLCanvasElement,
  reportEl: HTMLElement,
  filename: string,
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const bgRgb: [number, number, number] = [2, 3, 10];

  // --- Page 1: sky view, fit-to-page preserving aspect, vertically centered.
  pdf.setFillColor(...bgRgb);
  pdf.rect(0, 0, pageW, pageH, 'F');

  const skyAspect = spaceCanvas.width / spaceCanvas.height;
  const maxSkyW = pageW - margin * 2;
  const maxSkyH = pageH - margin * 2;
  let skyW = maxSkyW;
  let skyH = skyW / skyAspect;
  if (skyH > maxSkyH) {
    skyH = maxSkyH;
    skyW = skyH * skyAspect;
  }
  const skyX = (pageW - skyW) / 2;
  const skyY = (pageH - skyH) / 2;
  pdf.addImage(
    spaceCanvas.toDataURL('image/jpeg', 0.92),
    'JPEG',
    skyX,
    skyY,
    skyW,
    skyH,
  );

  // --- Subsequent pages: paginated report.
  const dpr = window.devicePixelRatio || 1;
  const captureScale = Math.max(2, dpr);
  const reportCanvas = await html2canvas(reportEl, {
    backgroundColor: '#02030a',
    scale: captureScale,
    useCORS: true,
    logging: false,
  });

  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;
  // Conversion: source pixels → PDF points.
  const ptPerPx = usableW / reportCanvas.width;
  const chunkPxH = Math.floor(usableH / ptPerPx);

  let yPx = 0;
  while (yPx < reportCanvas.height) {
    const slicePxH = Math.min(chunkPxH, reportCanvas.height - yPx);
    const slice = document.createElement('canvas');
    slice.width = reportCanvas.width;
    slice.height = slicePxH;
    const sctx = slice.getContext('2d');
    if (!sctx) throw new Error('Impossible de créer le contexte 2D');
    sctx.fillStyle = '#02030a';
    sctx.fillRect(0, 0, slice.width, slice.height);
    sctx.drawImage(reportCanvas, 0, -yPx);

    pdf.addPage();
    pdf.setFillColor(...bgRgb);
    pdf.rect(0, 0, pageW, pageH, 'F');
    pdf.addImage(
      slice.toDataURL('image/jpeg', 0.92),
      'JPEG',
      margin,
      margin,
      usableW,
      slicePxH * ptPerPx,
    );

    yPx += slicePxH;
  }

  pdf.save(filename);
}

/** Build a dated filename slug from the input (no extension). */
function reportFileSlug(date: Date, place?: string): string {
  const iso = date.toISOString().slice(0, 10);
  const slug = place
    ? `_${place
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, '')}`
    : '';
  return `signe-astronomique_${iso}${slug}`;
}

/** PDF filename for the full report (sky cover + paginated report). */
export function reportPdfFilename(date: Date, place?: string): string {
  return `${reportFileSlug(date, place)}.pdf`;
}

/** PNG filename for a sky-view-only capture (no report panel). */
export function viewFilename(dateForFile: Date | null, place?: string): string {
  if (dateForFile) {
    return `${reportFileSlug(dateForFile, place)}_vue-seule.png`;
  }
  const iso = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `signe-astronomique_vue-seule_${iso}.png`;
}

/**
 * Download the WebGL canvas as a PNG after the caller has run `viewer.render()`.
 */
export function downloadCanvasPng(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Impossible de capturer le canvas'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      },
      'image/png',
    );
  });
}
