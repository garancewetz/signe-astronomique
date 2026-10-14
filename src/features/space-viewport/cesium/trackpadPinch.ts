import { Cartesian3, type Viewer } from 'cesium';
import type { MutableRefObject } from 'react';
import { MAX_CAMERA_DIST_M, MIN_CAMERA_DIST_M } from './cameraLimits';

/** Zoom per wheel-delta pixel: a full trackpad pinch ≈ ×2–3 in distance. */
const PINCH_SENSITIVITY = 0.01;

/** Minimal shape of Safari's non-standard GestureEvent. */
interface GestureLikeEvent extends Event {
  scale: number;
}

interface AttachOptions {
  /** Side View zooms along the view axis instead of toward Earth. */
  sideViewActiveRef: MutableRefObject<boolean>;
}

/**
 * Trackpad pinch-to-zoom on desktop. Browsers don't send it as a pinch:
 * Chrome, Firefox and Edge emit `wheel` events with `ctrlKey` set, Safari
 * emits `gesture*` events. Cesium's controller ignores both (a ctrl-wheel
 * doesn't match its plain WHEEL zoom), and the browser would zoom the whole
 * page instead. This catches them on the canvas and zooms the camera by a
 * factor, clamped to the same distances as the keyboard nav.
 */
export function attachTrackpadPinch(
  viewer: Viewer,
  { sideViewActiveRef }: AttachOptions,
): () => void {
  const canvas = viewer.canvas;

  /** factor < 1 zooms in, > 1 zooms out. */
  const zoomBy = (factor: number) => {
    const camera = viewer.camera;
    const dist = Cartesian3.magnitude(camera.position);
    if (sideViewActiveRef.current) {
      const step = Math.abs(1 - factor) * dist;
      if (factor < 1) camera.zoomIn(step);
      else camera.zoomOut(step);
      return;
    }
    const target = Math.min(MAX_CAMERA_DIST_M, Math.max(MIN_CAMERA_DIST_M, dist * factor));
    if (target < dist) camera.zoomIn(dist - target);
    else if (target > dist) camera.zoomOut(target - dist);
  };

  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return; // plain wheel: Cesium's own zoom handles it
    e.preventDefault(); // no page zoom
    e.stopImmediatePropagation();
    zoomBy(Math.exp(e.deltaY * PINCH_SENSITIVITY));
  };

  let lastScale = 1;
  const onGestureStart = (e: Event) => {
    e.preventDefault();
    lastScale = 1;
  };
  const onGestureChange = (e: Event) => {
    e.preventDefault();
    const { scale } = e as GestureLikeEvent;
    if (!scale) return;
    // Fingers apart (scale up) → closer: distance shrinks by the same ratio.
    zoomBy(lastScale / scale);
    lastScale = scale;
  };

  // Capture phase, non-passive: run before Cesium's listener and allow
  // preventDefault (page zoom).
  const opts: AddEventListenerOptions = { capture: true, passive: false };
  canvas.addEventListener('wheel', onWheel, opts);
  canvas.addEventListener('gesturestart', onGestureStart, opts);
  canvas.addEventListener('gesturechange', onGestureChange, opts);

  return () => {
    canvas.removeEventListener('wheel', onWheel, opts);
    canvas.removeEventListener('gesturestart', onGestureStart, opts);
    canvas.removeEventListener('gesturechange', onGestureChange, opts);
  };
}
