import { Cartesian3, type Viewer } from 'cesium';

const NAV_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'a', 'A', 'e', 'E', 'z', 'Z', 's', 'S',
  '+', '=', '-', '_',
  'PageUp', 'PageDown',
]);

// MIN_DIST est mesuré depuis le centre Terre (magnitude de la position
// ECEF). 6 371 km = rayon moyen, +50 km de marge → la caméra reste juste
// au-dessus de la surface en zoom maxi, sans pouvoir traverser le globe.
const MIN_DIST = 6_421_000;          // ~50 km d'altitude au-dessus du sol
const MAX_DIST = 950_000_000;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

interface AttachOptions {
  /**
   * Mirror of the `sideViewActive` prop. Read from inside the preRender
   * tick (which is set up once and so can't close over the prop). The
   * caller is responsible for keeping `.current` up to date.
   */
  sideViewActiveRef: { current: boolean };
}

/**
 * Navigation clavier — façon carte de jeu vidéo (AZERTY).
 *   ←/→ : orbite est/ouest    ↑/↓ : orbite nord/sud
 *   A/E : tourne la caméra (heading) en place
 *   Z/S (ou +/-) : zoom / dézoom
 *
 * Side View is detected and switches to camera-local pan + view-axis zoom
 * (otherwise the earth-centric orbit would swing the camera in a huge arc
 * and break the timeline framing).
 *
 * Returns a detach function — call it from the viewer-init effect's
 * cleanup, before `viewer.destroy()`.
 */
export function attachKeyboardNav(
  viewer: Viewer,
  { sideViewActiveRef }: AttachOptions,
): () => void {
  const pressedKeys = new Set<string>();

  const onKeyDown = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    if (!NAV_KEYS.has(e.key)) return;
    pressedKeys.add(e.key);
    e.preventDefault();
  };
  const onKeyUp = (e: KeyboardEvent) => { pressedKeys.delete(e.key); };
  const onBlur = () => { pressedKeys.clear(); };

  const tickCamera = () => {
    if (pressedKeys.size === 0) return;
    const camera = viewer.camera;
    const dist = Cartesian3.magnitude(camera.position);

    // Side View has the camera parked far from Earth, looking sideways
    // along a constellation timeline. Earth-centric orbit/zoom would swing
    // the camera in a huge arc and lurch on zoom — useless for inspecting
    // a diagram. Switch to camera-local pan + view-axis zoom, both scaled
    // to current distance so steps stay perceptible.
    if (sideViewActiveRef.current) {
      const panStep = dist * 0.015;
      const zoomStep = dist * 0.02;
      if (pressedKeys.has('ArrowLeft'))  camera.moveLeft(panStep);
      if (pressedKeys.has('ArrowRight')) camera.moveRight(panStep);
      if (pressedKeys.has('ArrowUp'))    camera.moveUp(panStep);
      if (pressedKeys.has('ArrowDown'))  camera.moveDown(panStep);
      // A/E heading rotation is intentionally skipped here: spinning the
      // camera around its own up vector would tilt the timeline off
      // horizontal and break the diagram framing.
      if (pressedKeys.has('+') || pressedKeys.has('=') ||
          pressedKeys.has('z') || pressedKeys.has('Z') ||
          pressedKeys.has('PageUp')) {
        camera.zoomIn(zoomStep);
      }
      if (pressedKeys.has('-') || pressedKeys.has('_') ||
          pressedKeys.has('s') || pressedKeys.has('S') ||
          pressedKeys.has('PageDown')) {
        camera.zoomOut(zoomStep);
      }
      return;
    }

    // Vitesses calibrées pour un mouvement perceptible sans être brutal,
    // proportionnelles au pas (~16 ms à 60 fps mais on s'en moque, Cesium
    // tourne à fréquence variable — les valeurs sont par frame).
    const orbitStep = 0.012;     // rad/frame  ≈ 0.7°
    const lookStep = 0.015;      // rad/frame  ≈ 0.85°
    const zoomFactor = 0.97;     // 3% par frame

    // Orbit around Earth. Convention: arrow points the direction the
    // camera moves around the target — pressing ArrowLeft orbits the
    // camera to the left (so the scene appears to swing right), matching
    // the FPS "look in this direction" mental model rather than Cesium's
    // default mouse-drag "grab the globe and pull" convention.
    if (pressedKeys.has('ArrowLeft'))  camera.rotateLeft(orbitStep);
    if (pressedKeys.has('ArrowRight')) camera.rotateRight(orbitStep);
    if (pressedKeys.has('ArrowUp'))    camera.rotateDown(orbitStep);
    if (pressedKeys.has('ArrowDown'))  camera.rotateUp(orbitStep);
    // Heading en place (rotation de la caméra sans changer sa position).
    if (pressedKeys.has('a') || pressedKeys.has('A')) camera.lookLeft(lookStep);
    if (pressedKeys.has('e') || pressedKeys.has('E')) camera.lookRight(lookStep);
    // Zoom : on rapproche/éloigne en bornant la distance au centre Terre.
    if (pressedKeys.has('+') || pressedKeys.has('=') ||
        pressedKeys.has('z') || pressedKeys.has('Z') ||
        pressedKeys.has('PageUp')) {
      const target = Math.max(MIN_DIST, dist * zoomFactor);
      if (target < dist) camera.zoomIn(dist - target);
    }
    if (pressedKeys.has('-') || pressedKeys.has('_') ||
        pressedKeys.has('s') || pressedKeys.has('S') ||
        pressedKeys.has('PageDown')) {
      const target = Math.min(MAX_DIST, dist / zoomFactor);
      if (target > dist) camera.zoomOut(target - dist);
    }
  };

  const removePreRender =
    viewer.scene.preRender.addEventListener(tickCamera);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return () => {
    removePreRender();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };
}
