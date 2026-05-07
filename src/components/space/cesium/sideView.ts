import {
  Cartesian3,
  EasingFunction,
  type Viewer,
} from 'cesium';
import {
  findConstellation,
  type CatalogConstellation,
} from '../../../data/constellationCatalog';
import {
  raDecToEcef,
  starShellRadiusMExpanded,
} from '../../../utils/skyCoordinates';

const SIDE_VIEW_DURATION_S = 2.5;
const RESTORE_DURATION_S = 2.0;

// Camera offset along the perpendicular, expressed as a multiple of the
// timeline length. With Cesium's default 60° FOV this puts the timeline at
// ~75 % of the screen width before the look-at bias is applied.
const CAMERA_OFFSET_FACTOR = 1.4;

// Look-at bias along T (Earth → far star), expressed as a fraction of the
// timeline length. Pushes the centre of the visible timeline to the LEFT
// of the screen so the BodyInfoHud panel (~20 rem on the right) does not
// obstruct the diagram. Derivation:
//   midpoint NDC x = -bias / (CAMERA_OFFSET_FACTOR · tan(half_fov))
// For 60° FOV (half-fov = 30°, tan ≈ 0.577) and CAMERA_OFFSET_FACTOR = 1.4,
// bias = 0.2 puts the midpoint at NDC x ≈ -0.25, i.e. ~37 % from the left
// edge — comfortably centred in the free space to the left of the panel.
const LOOK_AT_BIAS_FACTOR = 0.2;

/**
 * Snapshot of the camera state taken before entering side view, so the
 * "back to Earth perspective" toggle can return to exactly where the user
 * was — including any manual orbit/zoom they did before flipping.
 */
export interface CameraSnapshot {
  position: Cartesian3;
  direction: Cartesian3;
  up: Cartesian3;
}

export function captureCameraSnapshot(viewer: Viewer): CameraSnapshot {
  return {
    position: Cartesian3.clone(viewer.camera.positionWC),
    direction: Cartesian3.clone(viewer.camera.directionWC),
    up: Cartesian3.clone(viewer.camera.upWC),
  };
}

export function flyToCameraSnapshot(
  viewer: Viewer,
  snapshot: CameraSnapshot,
): void {
  viewer.camera.flyTo({
    destination: snapshot.position,
    orientation: { direction: snapshot.direction, up: snapshot.up },
    duration: RESTORE_DURATION_S,
    easingFunction: EasingFunction.CUBIC_IN_OUT,
  });
}

/**
 * Mean direction of a constellation on the celestial sphere, returned as
 * both the unit Cartesian (`T`) and the equivalent (RA, Dec) so callers
 * that need to reuse `raDecToEcef` for placing entities along the axis
 * (the distance ruler) can do so without re-deriving.
 *
 * Computed by averaging unit vectors so the 0h-RA wrap-around is handled
 * naturally — no special case for Pisces / Aquarius.
 */
export function constellationAxis(
  constellation: CatalogConstellation,
  gmstRad: number,
): { T: Cartesian3; raDeg: number; decDeg: number } {
  const sum = new Cartesian3(0, 0, 0);
  for (const star of constellation.stars) {
    const unit = raDecToEcef(star.ra, star.dec, gmstRad, 1);
    Cartesian3.add(sum, unit, sum);
  }
  const T = Cartesian3.normalize(sum, sum);
  const DEG = Math.PI / 180;
  const decDeg = Math.asin(T.z) / DEG;
  const raDeg = ((Math.atan2(T.y, T.x) / DEG) + 360) % 360;
  return { T, raDeg, decDeg };
}

/**
 * Side-view orthonormal basis from the timeline direction T.
 *   - O = T × Z-up: perpendicular offset (camera position direction).
 *     Falls back to T × X for constellations near the celestial pole,
 *     where T is parallel to Z and the cross product collapses.
 *   - up = cross(O, T): screen-up in world space. Chosen so that
 *     screen-right = cross(direction, up) = T (BAC-CAB derivation in
 *     `computeTimelineFrame` doc), locking the timeline horizontal with
 *     Earth at the left and far star at the right.
 *
 * Exposed so the distance ruler can orient its tick marks along the same
 * vertical (`up`) as the camera.
 */
export function sideViewBasis(T: Cartesian3): {
  O: Cartesian3;
  up: Cartesian3;
} {
  let O = Cartesian3.cross(T, Cartesian3.UNIT_Z, new Cartesian3());
  if (Cartesian3.magnitudeSquared(O) < 1e-6) {
    O = Cartesian3.cross(T, Cartesian3.UNIT_X, new Cartesian3());
  }
  Cartesian3.normalize(O, O);
  const up = Cartesian3.cross(O, T, new Cartesian3());
  Cartesian3.normalize(up, up);
  return { O, up };
}

/**
 * Maximum projection of any star onto the timeline axis. Equals the
 * radius of the farthest star (in expanded-shell space) when stars
 * cluster around T, but stays correct for elongated constellations.
 */
function timelineLengthM(
  constellation: CatalogConstellation,
  T: Cartesian3,
  gmstRad: number,
): number {
  let maxProjection = 0;
  for (const star of constellation.stars) {
    const pos = raDecToEcef(
      star.ra,
      star.dec,
      gmstRad,
      starShellRadiusMExpanded(star.distance_ly),
    );
    const projection = Cartesian3.dot(pos, T);
    if (projection > maxProjection) maxProjection = projection;
  }
  return maxProjection;
}

/**
 * Computes the camera frame for a strict horizontal-timeline side view.
 *
 * Goal: Earth (origin) on screen-left, farthest star on screen-right,
 * along a perfectly horizontal axis perpendicular to the constellation's
 * mean direction T. The look-at point is biased forward along T so the
 * timeline's visual centre lands in the free space to the left of the
 * BodyInfoHud panel.
 *
 * Math:
 *   - lookAt = T · timelineLength · (0.5 + LOOK_AT_BIAS_FACTOR)
 *   - position = lookAt + O · (timelineLength · CAMERA_OFFSET_FACTOR)
 *   - direction = -O (camera looks back at lookAt)
 *   - up = cross(O, T) so screen-right = cross(direction, up) = T
 *
 * Derivation of `up`: with direction = -O and up = cross(O, T), Cesium
 * computes right = cross(direction, up) = cross(-O, cross(O, T)). The
 * BAC-CAB rule expands this to -(O(O·T) - T(O·O)) = T (since O ⊥ T and
 * |O|=1). So screen-right ends up exactly aligned with T, which is what
 * makes the timeline horizontal and ascending rightward.
 */
function computeTimelineFrame(
  T: Cartesian3,
  timelineLength: number,
): { position: Cartesian3; direction: Cartesian3; up: Cartesian3 } {
  const { O, up } = sideViewBasis(T);

  const lookAt = Cartesian3.multiplyByScalar(
    T,
    timelineLength * (0.5 + LOOK_AT_BIAS_FACTOR),
    new Cartesian3(),
  );
  const offset = Cartesian3.multiplyByScalar(
    O,
    timelineLength * CAMERA_OFFSET_FACTOR,
    new Cartesian3(),
  );
  const position = Cartesian3.add(lookAt, offset, new Cartesian3());

  const direction = Cartesian3.negate(O, new Cartesian3());

  return { position, direction, up };
}

/**
 * Smoothly flies the camera to a strict horizontal-timeline side view of
 * the given constellation. Earth lands on the left, the farthest star on
 * the right, with the axis perfectly horizontal in screen space and the
 * timeline centred in the free space to the left of the BodyInfoHud.
 * Returns silently if the constellation abbreviation is unknown.
 */
export function flyToSideView(
  viewer: Viewer,
  constellationAbbr: string,
  gmstRad: number,
): void {
  const constellation = findConstellation(constellationAbbr);
  if (!constellation) return;
  const { T } = constellationAxis(constellation, gmstRad);
  const length = timelineLengthM(constellation, T, gmstRad);
  if (length <= 0) return;
  const { position, direction, up } = computeTimelineFrame(T, length);
  viewer.camera.flyTo({
    destination: position,
    orientation: { direction, up },
    duration: SIDE_VIEW_DURATION_S,
    easingFunction: EasingFunction.CUBIC_IN_OUT,
  });
}
