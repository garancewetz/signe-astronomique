import { Cartesian3, PerspectiveFrustum, type Viewer } from 'cesium';
import { MIN_CAMERA_DIST_M } from './cameraLimits';

/**
 * In side view, the camera sits hundreds of AU from Earth looking sideways
 * along a constellation timeline. Cesium's default screen-space camera
 * controller is Earth-centric in SCENE3D: pinch-zoom picks the globe as
 * its pivot, which is a tiny dot from this distance, so the math degenerates
 * and zoom/pan feel dead on mobile.
 *
 * This module installs camera-local touch handlers that mirror what the
 * keyboard navigation already does in side view (see viewerKeyboard.ts):
 *   - Single-finger drag → pan along the camera's right/up vectors.
 *   - Two-finger pinch    → zoom along the camera's view direction.
 *   - Two-finger drag     → pan (midpoint delta), so the gesture composes
 *     naturally with pinch.
 *
 * Cesium's screen-space camera controller is disabled while this is active
 * (`enableInputs = false`); the ScreenSpaceEventHandler used for tap-to-pick
 * is a separate system and keeps working.
 *
 * Gated on `(pointer: coarse)` by the caller so desktops with mouse/wheel
 * keep their working behavior.
 */

// On desktop, Cesium's screen-space controller effectively pins the side-view
// zoom-out at the entry distance: the camera arrives hundreds of AU from
// Earth — already far above `MAX_CAMERA_DIST_M` (the controller's
// `maximumZoomDistance` cap in SpaceView.tsx) — so any subsequent
// wheel-zoom-out is no-op'd. To match that feel on mobile we snapshot the
// post-`flyToSideView` distance and use it as the pinch-zoom-out cap. The
// delay covers `flyToSideView`'s 2.5 s animation (see SIDE_VIEW_DURATION_S
// in sideView.ts) plus a small margin.
const ENTRY_CAPTURE_DELAY_MS = 2700;

export function attachSideViewTouch(viewer: Viewer): () => void {
  const canvas = viewer.scene.canvas;
  const controller = viewer.scene.screenSpaceCameraController;
  const previousEnableInputs = controller.enableInputs;
  controller.enableInputs = false;

  let mode: 'idle' | 'pan' | 'pinch' = 'idle';
  let lastX = 0;
  let lastY = 0;
  let lastDist = 0;
  // Sentinel: pinch is unbounded until the entry-distance snapshot lands.
  // Stays Infinity if the user exits side view before flyToSideView settles.
  let maxDist = Number.POSITIVE_INFINITY;
  const captureTimeoutId = window.setTimeout(() => {
    maxDist = Cartesian3.magnitude(viewer.camera.positionWC);
  }, ENTRY_CAPTURE_DELAY_MS);

  const worldPerPx = (cameraDist: number): number => {
    const frustum = viewer.camera.frustum;
    const fov =
      frustum instanceof PerspectiveFrustum && frustum.fov != null
        ? frustum.fov
        : Math.PI / 3;
    const h = canvas.clientHeight || 1;
    return (2 * cameraDist * Math.tan(fov / 2)) / h;
  };

  const cameraDistance = (): number =>
    Cartesian3.magnitude(viewer.camera.positionWC);

  const seedFromTouches = (touches: TouchList): void => {
    if (touches.length === 1) {
      mode = 'pan';
      lastX = touches[0].clientX;
      lastY = touches[0].clientY;
    } else if (touches.length >= 2) {
      mode = 'pinch';
      const a = touches[0];
      const b = touches[1];
      lastX = (a.clientX + b.clientX) / 2;
      lastY = (a.clientY + b.clientY) / 2;
      lastDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    } else {
      mode = 'idle';
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    seedFromTouches(e.touches);
    if (e.touches.length >= 1) e.preventDefault();
  };

  const onTouchMove = (e: TouchEvent) => {
    const camera = viewer.camera;
    const dist = cameraDistance();
    const ppx = worldPerPx(dist);

    if (mode === 'pan' && e.touches.length === 1) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = x - lastX;
      const dy = y - lastY;
      // Natural drag: content follows finger. Drag right → camera moves left.
      // Drag down (dy>0 in screen coords) → camera moves up (so content moves down).
      if (dx !== 0) camera.moveLeft(dx * ppx);
      if (dy !== 0) camera.moveUp(dy * ppx);
      lastX = x;
      lastY = y;
      e.preventDefault();
      return;
    }

    if (mode === 'pinch' && e.touches.length >= 2) {
      const a = e.touches[0];
      const b = e.touches[1];
      const midX = (a.clientX + b.clientX) / 2;
      const midY = (a.clientY + b.clientY) / 2;
      const newDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

      // Pinch zoom: scale = newDist/lastDist. Pinch out (scale>1) → zoom in.
      // Move along the view axis by a fraction of current camera distance so
      // step size stays perceptible regardless of how far we are from Earth.
      // Clamp the post-zoom geocentric distance to [MIN_CAMERA_DIST_M, maxDist]
      // so we don't dive through the globe or drift past the side-view entry
      // distance (which is what desktop wheel-zoom is implicitly pinned to).
      if (lastDist > 0 && newDist > 0) {
        const scale = newDist / lastDist;
        const rawAmount = dist * (1 - 1 / scale);
        if (Number.isFinite(rawAmount)) {
          const target = Math.min(maxDist, Math.max(MIN_CAMERA_DIST_M, dist - rawAmount));
          const clampedAmount = dist - target;
          if (Math.abs(clampedAmount) > 1) {
            if (clampedAmount > 0) camera.zoomIn(clampedAmount);
            else camera.zoomOut(-clampedAmount);
          }
        }
      }

      // Two-finger drag pans the same way single-finger does.
      const dmx = midX - lastX;
      const dmy = midY - lastY;
      if (dmx !== 0) camera.moveLeft(dmx * ppx);
      if (dmy !== 0) camera.moveUp(dmy * ppx);

      lastX = midX;
      lastY = midY;
      lastDist = newDist;
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    // Re-seed reference points so going from 2 → 1 finger doesn't introduce
    // a jump (the remaining finger's coords become the new pan anchor).
    seedFromTouches(e.touches);
  };

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  canvas.addEventListener('touchcancel', onTouchEnd);

  return () => {
    window.clearTimeout(captureTimeoutId);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('touchcancel', onTouchEnd);
    controller.enableInputs = previousEnableInputs;
  };
}
