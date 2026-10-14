import {
  Cartesian2,
  Cartesian3,
  Color,
  DistanceDisplayCondition,
  HorizontalOrigin,
  LabelStyle,
  NearFarScalar,
  VerticalOrigin,
  type Viewer,
} from 'cesium';

interface MountOptions {
  /** Latitude in degrees, North positive. */
  latitude: number;
  /** Longitude in degrees, East positive. */
  longitude: number;
  /** Optional textual label rendered next to the marker. */
  label?: string;
}

// Neutral white "you are here" target: a dot ringed in the night colour,
// inside a thin white ring. Reads on land, sea and night side alike, and
// leaves gold to the true sign.
const MARKER_HEX = '#f5f5f4';
const OUTLINE_HEX = '#0b0e14';
// Proximity threshold for the place-name label. Below ~5 000 km of
// camera-to-marker distance the label fades in; from orbital views
// (100 000 km) it stays hidden so the central canvas reads as clean
// stars-and-Earth without floating text.
const LABEL_NEAR_M = 0;
const LABEL_FAR_M = 5_000_000;

/**
 * "You are here" marker on the globe surface — anchors the natal birth
 * location (or the live observer position) so the user can see where the
 * sky reading is being computed from.
 *
 * Rendered as a screen-space glow point clamped to the ellipsoid surface so
 * its on-screen position matches the underlying coordinates regardless of
 * camera angle. An earlier version stacked the point on top of a 250 km
 * vertical beam: from oblique cameras (relics view, ~1500 km altitude) the
 * beam tip projected onto the surface ~250 km away from the actual point,
 * making the marker visibly land in the wrong place. Uses the default depth
 * test so the marker is naturally hidden when on the far side of the globe.
 */
export function mountObserverMarker(
  viewer: Viewer,
  opts: MountOptions,
): () => void {
  const { latitude, longitude, label } = opts;

  const position = Cartesian3.fromDegrees(longitude, latitude, 0);
  const color = Color.fromCssColorString(MARKER_HEX);
  // Slightly shrink at far ranges so it reads as a pin and not a blob.
  const scaleByDistance = new NearFarScalar(2_000_000, 1.0, 60_000_000, 0.6);

  // Outer ring: a transparent point whose outline draws the circle.
  const ring = viewer.entities.add({
    position,
    point: {
      pixelSize: 15,
      color: Color.TRANSPARENT,
      outlineColor: color.withAlpha(0.6),
      outlineWidth: 1.5,
      scaleByDistance,
    },
    properties: { kind: 'observer-marker' },
  });

  const entity = viewer.entities.add({
    position,
    point: {
      pixelSize: 6,
      color,
      outlineColor: Color.fromCssColorString(OUTLINE_HEX).withAlpha(0.9),
      outlineWidth: 1.5,
      scaleByDistance,
    },
    ...(label
      ? {
          label: {
            text: label,
            font: "10px 'IBM Plex Mono', monospace",
            fillColor: color.withAlpha(0.95),
            style: LabelStyle.FILL,
            verticalOrigin: VerticalOrigin.BOTTOM,
            horizontalOrigin: HorizontalOrigin.LEFT,
            pixelOffset: new Cartesian2(8, -4),
            // Show the place name only when the camera is close to
            // the marker — keeps the orbital view uncluttered.
            distanceDisplayCondition: new DistanceDisplayCondition(
              LABEL_NEAR_M,
              LABEL_FAR_M,
            ),
          },
        }
      : {}),
    properties: { kind: 'observer-marker' },
  });

  return () => {
    // This cleanup lives in its own React effect, not in SpaceView's
    // cleanupsRef chain. On full SpaceView unmount, effect-cleanup order
    // means the viewer-creation effect (declared first) destroys the viewer
    // before this cleanup runs — accessing `viewer.entities` then throws.
    if (viewer.isDestroyed()) return;
    viewer.entities.remove(entity);
    viewer.entities.remove(ring);
  };
}
