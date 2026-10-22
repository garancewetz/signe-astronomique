import { Cartesian3, type Viewer } from 'cesium';
import { EARTH_RADIUS_M, formatDistanceKmOrAU } from '@/features/astronomy';

interface AttachOptions {
  /**
   * Fired only when the *displayed* label changes — the caller can use this
   * to drive React state without paying a re-render per frame.
   */
  onLabel: (label: string) => void;
}

/**
 * Live camera-altitude HUD listener. Subscribes to `scene.preRender`,
 * computes the camera's altitude above mean Earth radius from the
 * geocentric position, formats it via the shared distance formatter, and
 * pushes the result to `onLabel` only when the formatted string changes.
 *
 * Returns a detach function — call it before destroying the viewer.
 */
export function attachCameraDistanceListener(
  viewer: Viewer,
  { onLabel }: AttachOptions,
): () => void {
  let lastLabel: string | null = null;
  return viewer.scene.preRender.addEventListener(() => {
    const geocentricM = Cartesian3.magnitude(viewer.camera.position);
    const altKm = Math.max(0, geocentricM - EARTH_RADIUS_M) / 1000;
    const label = formatDistanceKmOrAU(altKm);
    if (label !== lastLabel) {
      lastLabel = label;
      onLabel(label);
    }
  });
}
