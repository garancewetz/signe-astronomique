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
  /**
   * The target's place on the ecliptic. On a portrait screen the camera
   * rolls so the ecliptic runs up the screen: the sign's stretch then uses
   * the tall axis instead of being cut at the narrow sides.
   */
  ecliptic?: { longitudeDeg: number; obliquityDeg: number };
}

/**
 * Unit vector along the ecliptic at a longitude (direction of increasing
 * longitude), in ECEF — the "up" of a portrait framing.
 */
function eclipticTangentEcef(longitudeDeg: number, obliquityDeg: number, gmstRad: number): Cartesian3 {
  const l = (longitudeDeg * Math.PI) / 180;
  const e = (obliquityDeg * Math.PI) / 180;
  // Equatorial (of date) tangent of the ecliptic circle at l.
  const x = -Math.sin(l);
  const y = Math.cos(l) * Math.cos(e);
  const z = Math.cos(l) * Math.sin(e);
  const raDeg = (Math.atan2(y, x) * 180) / Math.PI;
  const decDeg = (Math.asin(z) * 180) / Math.PI;
  const v = raDecToEcef(raDeg, decDeg, gmstRad, 1);
  return Cartesian3.normalize(new Cartesian3(v.x, v.y, v.z), new Cartesian3());
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
  const { raHours, decDeg, gmstRad, duration = 2.6, ecliptic } = p;
  const dirEcef = raDecToEcef(raHoursToDegrees(raHours), decDeg, gmstRad, 1);
  const sunVec = new Cartesian3(dirEcef.x, dirEcef.y, dirEcef.z);

  // Constant camera distance (stable orbit around Earth).
  const D = ORBITAL_ALTITUDE_M;

  // Portrait with a known ecliptic place: the ecliptic runs up the screen.
  // Decided by the screen, not the canvas: on desktop the result panel
  // narrows the canvas for a moment (it is still open when "see my sign"
  // is clicked), and the sky must not flip orientation because of it.
  const canvas = viewer.scene.canvas;
  const portrait = window.innerWidth < window.innerHeight
    && canvas.clientWidth < canvas.clientHeight
    && ecliptic !== undefined;
  // The camera sits a little off the anti-target axis so Earth doesn't hide
  // the target: a fixed angle, just clear of the Earth and its ring
  // (~2.9° at this distance), so the target lands near the centre with
  // room above it — and lands there whatever the canvas size at the time
  // of the click. Landscape: offset upward. Portrait: sideways, keeping
  // the sign's stretch centred along the tall ecliptic axis.
  const ALPHA = TARGET_OFFSET_RAD;

  // Reference "up": the celestial pole, or — portrait screens — the
  // ecliptic, so the sign's stretch runs along the tall axis.
  const zAxis = portrait
    ? eclipticTangentEcef(ecliptic.longitudeDeg, ecliptic.obliquityDeg, gmstRad)
    : new Cartesian3(0, 0, 1);
  // perp = reference up projected onto the plane ⊥ to sunVec, normalized.
  const dotZ = Cartesian3.dot(zAxis, sunVec);
  const perp = Cartesian3.subtract(
    zAxis,
    Cartesian3.multiplyByScalar(sunVec, dotZ, new Cartesian3()),
    new Cartesian3(),
  );
  Cartesian3.normalize(perp, perp);
  // Portrait: offset along the screen's horizontal (⊥ to both).
  const offsetAxis = portrait
    ? Cartesian3.normalize(Cartesian3.cross(sunVec, perp, new Cartesian3()), new Cartesian3())
    : perp;

  const term1 = Cartesian3.multiplyByScalar(
    sunVec,
    -Math.cos(ALPHA) * D,
    new Cartesian3(),
  );
  const term2 = Cartesian3.multiplyByScalar(
    offsetAxis,
    Math.sin(ALPHA) * D,
    new Cartesian3(),
  );
  const camPos = Cartesian3.add(term1, term2, new Cartesian3());

  // Landscape looks at Earth's centre (the target sits just above it).
  // Portrait looks straight at the target, so the sign's stretch is centred
  // on the narrow screen and the Earth moves off to the side of its band —
  // the south side of the ecliptic, away from the sign's label.
  const direction = portrait
    ? Cartesian3.clone(sunVec)
    : Cartesian3.normalize(Cartesian3.negate(camPos, new Cartesian3()), new Cartesian3());
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
