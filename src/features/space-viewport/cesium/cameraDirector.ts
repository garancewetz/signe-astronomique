import {
  Cartesian3,
  EasingFunction,
  type Viewer,
} from 'cesium';
import { raHoursToDegrees } from '@/features/astronomy';
import { raDecToEcef } from './skyVector';

// 130 000 km — Earth subtends ~5.5°, small enough that the constellation
// around the Sun reads as a whole (100 000 km felt cramped on wide screens:
// Cesium keeps the horizontal FOV, so wide canvases look the most zoomed
// in). Still well inside the celestial sphere (200 000 km).
const ORBITAL_ALTITUDE_M = 130_000_000;

// 22 000 km — arrival view: Earth fills ~40 % of the height, close enough
// to feel immersive. The first calculation flies out to the orbital view
// (flyToCelestialDirection), which turns into a dezoom onto the sky.
const ARRIVAL_ALTITUDE_M = 22_000_000;

// 8 000 km — Earth fills ~half the FOV, LEO satellites are visibly
// orbiting (~1 px/s at this distance), and the camera is still far enough
// out to keep the celestial backdrop legible.
const RELICS_ALTITUDE_M = 8_000_000;

/**
 * Default orbital view: equatorial orbit at ORBITAL_ALTITUDE_M, nadir gaze
 * toward (lat 0, lon 0). At this altitude Earth stays small in the field and the
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
 * Arrival view: close to Earth, looking down on the visitor's region. The
 * latitude is softened toward the equator so the globe still reads as a
 * whole sphere rather than a polar close-up.
 */
export function flyToArrival(viewer: Viewer, lat: number, lon: number): void {
  const softenedLat = Math.max(-35, Math.min(35, lat * 0.6));
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(lon, softenedLat, ARRIVAL_ALTITUDE_M),
    orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
    duration: 0,
  });
}

/**
 * Closer orbital view, used when the user enables the orbital relics layer.
 * From the default orbital view, LEO satellites are sub-pixel and don't
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

/** Angle between Earth's centre and the framed target, seen from the camera. */
const TARGET_OFFSET_RAD = (9 * Math.PI) / 180;

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
 * α (TARGET_OFFSET_RAD) keeps the target just clear of Earth's disc.
 */
export function flyToCelestialDirection(
  viewer: Viewer,
  p: CelestialDirParams,
): void {
  const { raHours, decDeg, gmstRad, duration = 2.6 } = p;
  const dirEcef = raDecToEcef(raHoursToDegrees(raHours), decDeg, gmstRad, 1);
  const sunVec = new Cartesian3(dirEcef.x, dirEcef.y, dirEcef.z);

  // Constant camera distance (stable orbit around Earth).
  const D = ORBITAL_ALTITUDE_M;

  // The camera sits a little off the anti-target axis so Earth doesn't hide
  // the target: a fixed angle, just clear of the Earth and its ring
  // (~2.9° at this distance), offset upward so the target lands near the
  // centre with room above it, whatever the canvas size at the time of the
  // click. Same framing on phones: the ecliptic stays horizontal, the way
  // the constellations are drawn everywhere else.
  const ALPHA = TARGET_OFFSET_RAD;

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

  // Look at Earth's centre: the target sits just above it.
  const direction = Cartesian3.normalize(Cartesian3.negate(camPos, new Cartesian3()), new Cartesian3());
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
