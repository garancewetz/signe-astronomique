import {
  Cartesian3,
  EasingFunction,
  PerspectiveFrustum,
  type Viewer,
} from 'cesium';
import { raHoursToDegrees } from '@/features/astronomy';
import { raDecToEcef } from './skyVector';

// 100 000 km — Earth subtends ~7° (a marble at arm's length), same
// calibration as lumina-sky. Leaves room for the Moon (~284 000 km from the
// camera on Earth's far side) and the celestial sphere (200 000 km).
const ORBITAL_ALTITUDE_M = 100_000_000;

// 8 000 km — Earth fills ~half the FOV, LEO satellites are visibly
// orbiting (~1 px/s at this distance), and the camera is still far enough
// out to keep the celestial backdrop legible.
const RELICS_ALTITUDE_M = 8_000_000;

/**
 * Default orbital view: equatorial orbit at 100 000 km, nadir gaze toward
 * (lat 0, lon 0). At this altitude Earth fills ~24° of the field and the
 * celestial sphere (200 000 km) stays comfortably behind — a real
 * "cockpit-in-orbit" feel.
 */
export function flyToOrbital(viewer: Viewer, duration = 1.5): void {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(0, 0, ORBITAL_ALTITUDE_M),
    orientation: {
      heading: 0,
      pitch: -Math.PI / 2,
      roll: 0,
    },
    duration,
    easingFunction: EasingFunction.QUADRATIC_IN_OUT,
  });
}

/**
 * Closer orbital view, used when the user enables the orbital relics layer.
 * From the default 100 000 km, LEO satellites are sub-pixel and don't
 * appear to move. At 8 000 km altitude, Earth fills roughly half the FOV
 * and ISS-like satellites visibly drift across.
 */
export function flyToRelicsView(viewer: Viewer, duration = 2.2): void {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(0, 0, RELICS_ALTITUDE_M),
    orientation: {
      heading: 0,
      pitch: -Math.PI / 2,
      roll: 0,
    },
    duration,
    easingFunction: EasingFunction.QUADRATIC_IN_OUT,
  });
}

interface CelestialDirParams {
  /** RA in hours (astroEngine convention). */
  raHours: number;
  /** Dec in degrees. */
  decDeg: number;
  /** GMST in radians at the rendered date. */
  gmstRad: number;
  /** Animation duration in seconds. Defaults to 2.6. */
  duration?: number;
}

/**
 * Frame a celestial direction (RA/Dec): the camera parks in orbit on the
 * opposite side of that direction and looks back at Earth — the target body
 * appears behind Earth, centered in the view.
 *
 * Geometry:
 *   dir      = unit Earth→body direction (ECEF, with GMST applied)
 *   camPos   = D · (−cos α · dir + sin α · perp)
 *   direction = −camPos / |camPos|       (camera → Earth's centre)
 *   up        = ẑ projected ⊥ to direction
 *
 * α offsets the target to ~30% of the vertical half-FOV.
 */
export function flyToCelestialDirection(
  viewer: Viewer,
  p: CelestialDirParams,
): void {
  const { raHours, decDeg, gmstRad, duration = 2.6 } = p;
  const camera = viewer.camera;

  const dirEcef = raDecToEcef(raHoursToDegrees(raHours), decDeg, gmstRad, 1);
  const sunVec = new Cartesian3(dirEcef.x, dirEcef.y, dirEcef.z);

  // Constant camera distance (stable orbit around Earth).
  const D = ORBITAL_ALTITUDE_M;

  // Real vertical half-FOV used to calibrate alpha. The Cesium frustum may
  // be perspective or orthographic; we keep a π/3 fallback for the non-
  // perspective case (never reached in SCENE3D natal mode).
  const frustum = camera.frustum;
  const fovHoriz =
    frustum instanceof PerspectiveFrustum && frustum.fov != null
      ? frustum.fov
      : Math.PI / 3;
  const aspect =
    viewer.scene.canvas.clientWidth / viewer.scene.canvas.clientHeight;
  const fovVert =
    aspect > 1
      ? 2 * Math.atan(Math.tan(fovHoriz / 2) / aspect)
      : fovHoriz;
  const ALPHA = fovVert * 0.3;

  // perp = celestial pole (Z) projected onto the plane ⊥ to sunVec, normalized.
  const zAxis = new Cartesian3(0, 0, 1);
  const dotZ = Cartesian3.dot(zAxis, sunVec);
  const perp = Cartesian3.subtract(
    zAxis,
    Cartesian3.multiplyByScalar(sunVec, dotZ, new Cartesian3()),
    new Cartesian3(),
  );
  Cartesian3.normalize(perp, perp);

  const term1 = Cartesian3.multiplyByScalar(
    sunVec,
    -Math.cos(ALPHA) * D,
    new Cartesian3(),
  );
  const term2 = Cartesian3.multiplyByScalar(
    perp,
    Math.sin(ALPHA) * D,
    new Cartesian3(),
  );
  const camPos = Cartesian3.add(term1, term2, new Cartesian3());

  const direction = Cartesian3.normalize(
    Cartesian3.negate(camPos, new Cartesian3()),
    new Cartesian3(),
  );
  const upDot = Cartesian3.dot(zAxis, direction);
  const up = Cartesian3.subtract(
    zAxis,
    Cartesian3.multiplyByScalar(direction, upDot, new Cartesian3()),
    new Cartesian3(),
  );
  Cartesian3.normalize(up, up);

  viewer.camera.flyTo({
    destination: camPos,
    orientation: { direction, up },
    duration,
    easingFunction: EasingFunction.QUADRATIC_IN_OUT,
  });
}
