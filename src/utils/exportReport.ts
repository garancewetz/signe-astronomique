import html2canvas from 'html2canvas-pro';

/**
 * Capture composite : la vue 3D Cesium en arrière-plan + le rapport complet
 * (rendu hors-écran, contient toutes les sections empilées) collé sur le bord
 * droit du PNG. Le canvas de sortie s'allonge verticalement si le rapport
 * dépasse la hauteur du viewport — c'est volontaire : on exporte tout, pas
 * seulement ce qui tient à l'écran.
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
  const reportTop = 44; // top-11 ≈ aligné avec le bord supérieur des panels droits
  const bottomPadding = 24;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const outH = Math.max(viewportH, reportTop + reportH + bottomPadding);

  const out = document.createElement('canvas');
  out.width = Math.round(viewportW * scale);
  out.height = Math.round(outH * scale);
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Impossible de créer le contexte 2D');

  // Fond cockpit (au cas où la 3D laisse des bords transparents).
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, out.width, out.height);

  // Vue 3D : étirée pour remplir le viewport, ancrée en haut.
  ctx.drawImage(
    spaceCanvas,
    0, 0,
    Math.round(viewportW * scale),
    Math.round(viewportH * scale),
  );

  // Rapport : ancré au bord droit, à `reportTop` du haut.
  const reportLeft = viewportW - reportW;
  ctx.drawImage(
    reportCanvas,
    Math.round(reportLeft * scale),
    Math.round(reportTop * scale),
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
