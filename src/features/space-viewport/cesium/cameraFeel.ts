import { CameraEventType, KeyboardEventModifier, type Viewer } from 'cesium';

/**
 * Cesium's camera controller turns too fast for this scene. Far from Earth
 * (the sky view), a drag spins the globe at its maximum rate (1.77): a third
 * of the screen swept is already more than half a turn, and the 0.9 inertia
 * keeps the sky spinning long after release — people lose their bearings.
 *
 * Slower spin and a short coast everywhere, a little calmer still on touch
 * screens, where a thumb sweeps further than a mouse. On touch, two-finger
 * gestures also stop tilting the camera (it reads as the sky "falling over"
 * mid-pinch): pinch only zooms.
 */

interface Feel {
  /** Max spin rate: a full-width drag turns rate · 2π. */
  maxRotateRate: number;
  /** How long a flick keeps spinning / zooming (Cesium default 0.9 / 0.8). */
  inertiaSpin: number;
  inertiaZoom: number;
}

/** A full-width mouse drag ≈ 0.5 · 2π ≈ 180°. */
const MOUSE: Feel = { maxRotateRate: 0.5, inertiaSpin: 0.65, inertiaZoom: 0.6 };
/** A full-width swipe ≈ 0.4 · 2π ≈ 145°. */
const TOUCH: Feel = { maxRotateRate: 0.4, inertiaSpin: 0.55, inertiaZoom: 0.5 };

/** Cesium keeps the spin-rate cap private; it is read on every drag. */
interface RotateRateInternals {
  _maximumRotateRate: number;
}

export function tuneCameraFeel(viewer: Viewer, { touch }: { touch: boolean }): () => void {
  const controller = viewer.scene.screenSpaceCameraController;
  const internals = controller as unknown as RotateRateInternals;
  const previous = {
    rotateRate: internals._maximumRotateRate,
    inertiaSpin: controller.inertiaSpin,
    inertiaZoom: controller.inertiaZoom,
    tilt: controller.tiltEventTypes,
  };

  const feel = touch ? TOUCH : MOUSE;
  internals._maximumRotateRate = feel.maxRotateRate;
  controller.inertiaSpin = feel.inertiaSpin;
  controller.inertiaZoom = feel.inertiaZoom;
  if (touch) {
    // Same list as Cesium's default, minus PINCH.
    controller.tiltEventTypes = [
      CameraEventType.MIDDLE_DRAG,
      { eventType: CameraEventType.LEFT_DRAG, modifier: KeyboardEventModifier.CTRL },
      { eventType: CameraEventType.RIGHT_DRAG, modifier: KeyboardEventModifier.CTRL },
    ];
  }

  return () => {
    if (controller.isDestroyed()) return;
    internals._maximumRotateRate = previous.rotateRate;
    controller.inertiaSpin = previous.inertiaSpin;
    controller.inertiaZoom = previous.inertiaZoom;
    controller.tiltEventTypes = previous.tilt;
  };
}
