import {
  ArcType,
  Cartesian2,
  Cartesian3,
  Color,
  HorizontalOrigin,
  LabelStyle,
  NearFarScalar,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';

interface MountOptions {
  /** Latitude in degrees, North positive. */
  latitude: number;
  /** Longitude in degrees, East positive. */
  longitude: number;
  /** Optional textual label rendered next to the beam. */
  label?: string;
}

// Rose-pink, distinct from the amber guides and sky satellites palette.
const MARKER_HEX = '#f472b6';
// Beam height — comparable to LEO altitude. Tall enough to be visible
// from the default 100 000 km orbital view, short enough to not dominate
// the relics view (~1500 km altitude camera).
const BEAM_HEIGHT_M = 250_000;

/**
 * "You are here" marker on the globe surface — anchors the natal birth
 * location (or the live observer position) so the user can see where the
 * sky reading is being computed from.
 *
 * Rendering: a thin vertical beam from the surface to ~250 km up, capped
 * by a glow point with the place label. Uses the default depth test so
 * the marker is naturally hidden when on the far side of the globe.
 */
export function mountObserverMarker(
  viewer: Viewer,
  opts: MountOptions,
): () => void {
  const { latitude, longitude, label } = opts;
  const created: Entity[] = [];

  const surface = Cartesian3.fromDegrees(longitude, latitude, 0);
  const top = Cartesian3.fromDegrees(longitude, latitude, BEAM_HEIGHT_M);

  const color = Color.fromCssColorString(MARKER_HEX);

  created.push(
    viewer.entities.add({
      polyline: {
        positions: [surface, top],
        width: 1.5,
        arcType: ArcType.NONE,
        material: color.withAlpha(0.75),
      },
      properties: { kind: 'observer-marker' },
    }),
  );

  created.push(
    viewer.entities.add({
      position: top,
      point: {
        pixelSize: 9,
        color: color.withAlpha(0.95),
        outlineColor: color.withAlpha(0.35),
        outlineWidth: 2,
        // Slightly shrink at far ranges so it reads as a pin and not a blob.
        scaleByDistance: new NearFarScalar(2_000_000, 1.0, 60_000_000, 0.6),
      },
      ...(label
        ? {
            label: {
              text: label,
              font: "10px 'JetBrains Mono', monospace",
              fillColor: color.withAlpha(0.95),
              style: LabelStyle.FILL,
              verticalOrigin: VerticalOrigin.BOTTOM,
              horizontalOrigin: HorizontalOrigin.LEFT,
              pixelOffset: new Cartesian2(8, -4),
            },
          }
        : {}),
      properties: { kind: 'observer-marker' },
    }),
  );

  return () => {
    // This cleanup lives in its own React effect, not in SpaceView's
    // cleanupsRef chain. On full SpaceView unmount, effect-cleanup order
    // means the viewer-creation effect (declared first) destroys the viewer
    // before this cleanup runs — accessing `viewer.entities` then throws.
    if (viewer.isDestroyed()) return;
    for (const e of created) viewer.entities.remove(e);
  };
}
