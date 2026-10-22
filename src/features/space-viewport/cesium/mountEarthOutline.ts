import {
  ArcType,
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Color,
  LabelStyle,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';
import { EARTH_RADIUS_M } from '@/features/astronomy';

/**
 * A thin ring around the Earth, with its name, in the sky view. Seen from
 * the anti-Sun side (how the natal sky is framed), the Earth shows its
 * night face: a black disc that reads as a hole in the sky, and the whole
 * idea — "seen from Earth, the Sun is in front of…" — loses its anchor.
 *
 * The ring is a polyline around the limb, rebuilt each frame in the plane
 * facing the camera, so its line keeps a constant pixel width at any
 * distance. Hidden up close (the globe speaks for itself) and from very
 * far (side view, where it would collapse onto a dot).
 */

const RING_RADIUS_M = EARTH_RADIUS_M * 1.06;
const SEGMENTS = 72;
const SHOW_FROM_M = 50_000_000;
const SHOW_UNTIL_M = 5_000_000_000;
const STROKE = Color.fromCssColorString('#9fb4e8');

export function mountEarthOutline(viewer: Viewer, label: string): () => void {
  const ring: Cartesian3[] = Array.from({ length: SEGMENTS + 1 }, () => new Cartesian3());
  const labelPos = new Cartesian3();
  const toCamera = new Cartesian3();
  const u = new Cartesian3();
  const v = new Cartesian3();
  const scratch = new Cartesian3();
  let visible = false;

  const update = () => {
    const camPos = viewer.camera.positionWC;
    const dist = Cartesian3.magnitude(camPos);
    visible = dist > SHOW_FROM_M && dist < SHOW_UNTIL_M;
    if (!visible) return;
    Cartesian3.normalize(camPos, toCamera);
    // u: the camera's up, flattened onto the plane facing the camera, so the
    // label sits under the ring on screen whatever the camera roll.
    Cartesian3.multiplyByScalar(toCamera, Cartesian3.dot(viewer.camera.upWC, toCamera), scratch);
    Cartesian3.subtract(viewer.camera.upWC, scratch, u);
    Cartesian3.normalize(u, u);
    Cartesian3.cross(toCamera, u, v);
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      Cartesian3.multiplyByScalar(u, Math.cos(a) * RING_RADIUS_M, ring[i]);
      Cartesian3.multiplyByScalar(v, Math.sin(a) * RING_RADIUS_M, scratch);
      Cartesian3.add(ring[i], scratch, ring[i]);
    }
    Cartesian3.multiplyByScalar(u, -RING_RADIUS_M, labelPos);
  };
  update();
  const removeListener = viewer.scene.preRender.addEventListener(update);

  const ringEntity: Entity = viewer.entities.add({
    polyline: {
      positions: new CallbackProperty(() => (visible ? ring : []), false),
      width: 1.2,
      arcType: ArcType.NONE,
      material: STROKE.withAlpha(0.55),
    },
  });
  const labelEntity: Entity = viewer.entities.add({
    position: new CallbackPositionProperty(() => labelPos, false),
    label: {
      text: label,
      font: "12px 'IBM Plex Mono', monospace",
      fillColor: STROKE.withAlpha(0.9),
      style: LabelStyle.FILL,
      verticalOrigin: VerticalOrigin.TOP,
      pixelOffset: new Cartesian2(0, 6),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      show: new CallbackProperty(() => visible, false),
    },
  });

  return () => {
    removeListener();
    viewer.entities.remove(ringEntity);
    viewer.entities.remove(labelEntity);
  };
}
