import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

/**
 * Capture empilée verticalement : la vue 3D du ciel en haut, puis le rapport
 * complet (toutes ses sections déjà empilées) dessous. Résultat : un PNG long
 * format portrait, lisible comme une page.
 *
 * Le PNG prend la largeur naturelle du rapport (rendu hors-écran à `w-md`).
 * La vue 3D est mise à l'échelle pour remplir cette largeur en conservant
 * l'aspect du viewport.
 *
 * Pré-requis : le canvas Cesium doit avoir été créé avec
 * `preserveDrawingBuffer: true` (cf. SpaceView), sinon le buffer est vide
 * au moment où on le lit. Pour la même raison on demande à la SpaceView
 * de forcer un `viewer.render()` synchrone avant de nous remettre le canvas.
 */
export async function exportTargetedPng(
  spaceCanvas: HTMLCanvasElement,
  reportEl: HTMLElement,
  filename = 'astrolabe-report.png',
): Promise<void> {
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.max(2, dpr);

  const reportCanvas = await html2canvas(reportEl, {
    backgroundColor: null,
    scale,
    useCORS: true,
    logging: false,
  });

  const reportW = reportEl.offsetWidth;
  const reportH = reportEl.offsetHeight;

  // PDF-like portrait width (close to A4 at 96dpi). The report keeps its
  // natural narrow width and sits centered; the sky view fills the full
  // page width with the viewport's aspect ratio preserved.
  const outW = Math.max(794, reportW);
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const skyAspect = viewportW / viewportH;
  const skyH = outW / skyAspect;

  const gap = 24;
  const outH = skyH + gap + reportH + gap;
  const reportLeft = Math.round((outW - reportW) / 2);

  const out = document.createElement('canvas');
  out.width = Math.round(outW * scale);
  out.height = Math.round(outH * scale);
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Impossible de créer le contexte 2D');

  // Cockpit background (fills the gap and any transparent edges).
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, out.width, out.height);

  // Sky view on top, scaled to fill the output width.
  ctx.drawImage(
    spaceCanvas,
    0,
    0,
    Math.round(outW * scale),
    Math.round(skyH * scale),
  );

  // Full report stacked below, centered horizontally.
  ctx.drawImage(
    reportCanvas,
    Math.round(reportLeft * scale),
    Math.round((skyH + gap) * scale),
    Math.round(reportW * scale),
    Math.round(reportH * scale),
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    out.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('Impossible de générer le PNG');

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Génère un nom de fichier daté basé sur l'input. */
export function reportFilename(date: Date, place?: string): string {
  const iso = date.toISOString().slice(0, 10);
  const slug = place ? `-${place.toLowerCase().normalize('NFD').replace(/[^\w]/g, '')}` : '';
  return `astrolabe_${iso}${slug}.png`;
}

/**
 * Nom de fichier pour une capture **vue 3D seule** (sans panneau rapport).
 */
export function viewFilename(dateForFile: Date | null, place?: string): string {
  if (dateForFile) {
    const base = reportFilename(dateForFile, place).replace(/\.png$/i, '');
    return `${base}_vue-seule.png`;
  }
  const iso = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  return `astrolabe_vue-seule_${iso}.png`;
}

/**
 * Télécharge le canvas WebGL tel quel (PNG), après `viewer.render()` côté appelant.
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
