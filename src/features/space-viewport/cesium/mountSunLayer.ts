import {
  CallbackPositionProperty,
  Cartesian2,
  Cartesian3,
  Color,
  HorizontalOrigin,
  LabelStyle,
  Matrix3,
  ReferenceFrame,
  Simon1994PlanetaryPositions,
  Transforms,
  VerticalOrigin,
  type Entity,
  type JulianDate,
  type Viewer,
} from 'cesium';
import type { IauConstellation } from '@/features/astronomy';

interface MountOptions {
  /** Sun right-ascension in hours (astroEngine convention). */
  raHours: number;
  /** Sun declination in degrees. */
  decDeg: number;
  /** IAU constellation the Sun is currently in. */
  constellation: IauConstellation;
  /** Localized display name (e.g. "Soleil"/"Sun") for the in-scene label. */
  displayName: string;
  /** Render the textual label next to the disk. */
  showLabels?: boolean;
}

// Module-level scratch buffers to avoid per-frame allocations in the
// CallbackProperty. Safe because at most one sun layer is ever mounted
// concurrently — duplicating the layer would cause the two callbacks to
// corrupt each other's intermediate state.
const scratchInertial = new Cartesian3();
const scratchMatrix = new Matrix3();

/**
 * Compute the Sun's ECEF position using Cesium's own ephemeris pipeline —
 * `Simon1994PlanetaryPositions` for the inertial-frame position, and
 * `computeTemeToPseudoFixedMatrix` for the inertial→fixed rotation. This is
 * exactly the chain Cesium itself uses internally to position
 * `viewer.scene.sun`, so anchoring our click-pick entity to the same
 * computation guarantees the visible Sun glow and the clickable target
 * sit on the same pixel, on any date — no precession drift even in 1926.
 */
function sunPositionEcef(time: JulianDate, result?: Cartesian3): Cartesian3 {
  const inertial = Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(
    time,
    scratchInertial,
  );
  const matrix = Transforms.computeTemeToPseudoFixedMatrix(time, scratchMatrix);
  return Matrix3.multiplyByVector(matrix, inertial, result ?? new Cartesian3());
}

/**
 * Sun click-pick proxy. The visible glow is Cesium's built-in
 * `viewer.scene.sun`; this entity adds a transparent, generously sized
 * point at the same ECEF position so the user can click the disk and
 * receive the precomputed natal `SelectedSun` payload.
 *
 * The position is wrapped in a `CallbackProperty` that re-derives the
 * Sun's ECEF coordinates from the viewer's clock each frame, so when the
 * clock changes (`active.input.date` jumps to a new natal date) the proxy
 * follows the glow without us having to remount. `raHours`/`decDeg` in the
 * properties come from the app's astroEngine and define the natal
 * constellation — they may differ from Cesium's by arcseconds, which is
 * irrelevant at constellation scale.
 */
export function mountSunLayer(viewer: Viewer, opts: MountOptions): () => void {
  const { raHours, decDeg, constellation, displayName, showLabels = false } = opts;

  const entity: Entity = viewer.entities.add({
    // `CallbackPositionProperty` (vs the generic `CallbackProperty`) is the
    // one that satisfies the `position` field — it carries a reference
    // frame so the renderer knows how to transform the returned vector.
    // We compute in ECEF (after `computeTemeToPseudoFixedMatrix`), hence
    // `ReferenceFrame.FIXED`.
    position: new CallbackPositionProperty(
      // Cesium types the callback's `time` as optional; when absent (rare —
      // happens during property introspection, not steady-state rendering)
      // we return undefined and let the renderer try again next frame.
      (time, result) => (time ? sunPositionEcef(time, result) : undefined),
      false,
      ReferenceFrame.FIXED,
    ),
    point: {
      pixelSize: 28,
      color: Color.TRANSPARENT,
      // Without this the proxy is depth-clipped behind the celestial sphere
      // and the click-pick misses on certain camera angles.
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    ...(showLabels
      ? {
          label: {
            text: `☀ ${displayName}`,
            font: "10px 'JetBrains Mono', monospace",
            fillColor: Color.fromCssColorString('#fcd34d').withAlpha(0.9),
            style: LabelStyle.FILL,
            verticalOrigin: VerticalOrigin.CENTER,
            horizontalOrigin: HorizontalOrigin.LEFT,
            pixelOffset: new Cartesian2(12, 0),
          },
        }
      : {}),
    properties: {
      kind: 'sun',
      name: displayName,
      constellation,
      raHours,
      decDeg,
    },
  });

  return () => {
    viewer.entities.remove(entity);
  };
}
