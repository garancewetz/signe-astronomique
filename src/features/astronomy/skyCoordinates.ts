/**
 * ICRS J2000 → ECEF (Earth-Centered Earth-Fixed) coordinate transforms used
 * to project the celestial sphere for the 3D scene. Treats the sphere as
 * geocentric — the parallax between Earth's surface and centre is below
 * naked-eye resolution (~1.8°), so one projection serves every camera.
 *
 * Pure math, framework-agnostic: outputs `[x, y, z]` tuples. The Cesium-
 * typed wrapper that returns `Cartesian3` lives in
 * `src/components/space/cesium/skyVector.ts`.
 *
 * Algorithms: Meeus, Astronomical Algorithms (2nd ed.) — chapters 12 (GMST)
 * and 13 (equatorial transforms). Precession and nutation are ignored
 * (< 0.5° / century, invisible at constellation scale).
 */

import { toJulianDay } from './astroEngine';

const DEG = Math.PI / 180;

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Greenwich Mean Sidereal Time, degrees [0..360) — Meeus 12.4. */
function gmstDegrees(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const theta =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return norm360(theta);
}

/** GMST en radians depuis une Date JS. */
export function gmstRadians(date: Date): number {
  return gmstDegrees(toJulianDay(date)) * DEG;
}

/**
 * Direction (RA, Dec) in ICRS → ECEF position at a given radius, returned
 * as `[x, y, z]` in metres. ECI→ECEF rotation is `R_z(-GMST)`. Catalogue
 * J2000 coordinates are treated as apparent ICRS (precession ignored).
 *
 * @param raDeg    Right ascension in degrees [0..360)
 * @param decDeg   Declination in degrees [-90..+90]
 * @param gmstRad  GMST in radians (cf. gmstRadians)
 * @param radiusM  Radius in metres (distance from Earth centre)
 */
export function raDecToEcefXYZ(
  raDeg: number,
  decDeg: number,
  gmstRad: number,
  radiusM: number,
): [number, number, number] {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const xi = Math.cos(dec) * Math.cos(ra);
  const yi = Math.cos(dec) * Math.sin(ra);
  const zi = Math.sin(dec);
  const c = Math.cos(gmstRad);
  const s = Math.sin(gmstRad);
  const xe = xi * c + yi * s;
  const ye = -xi * s + yi * c;
  return [xe * radiusM, ye * radiusM, zi * radiusM];
}

/** Decimal hours → degrees (astroEngine stores RA in hours). */
export const raHoursToDegrees = (raHours: number): number => raHours * 15;

/** One astronomical unit in kilometres. */
export const AU_KM = 149_597_870.7;

/**
 * Radius of the celestial sphere onto which we project the sky (km).
 * = 100 AU, twice Pluto's aphelion. This puts every projected sky element
 * **behind** every solar-system body — the depth ordering Moon < Sun <
 * planets < celestial sphere stays correct, and Cesium's depth test handles
 * occlusion (Earth in front, etc.) without us having to fake the order.
 *
 * Still used by the reference lines (celestial equator, ecliptic) and by
 * the projected Sun/Moon directions. Catalog stars now live in a
 * logarithmic shell around this sphere (see starShellRadiusM).
 */
export const CELESTIAL_SPHERE_KM = 100 * AU_KM;

// ─── Log-compressed star shell ──────────────────────────────────────────────
// We cannot place stars at their real distances (4–2500 ly = 250 000–1.6e8
// AU) without blowing past the camera frustum (currently capped at 200 AU).
// Instead we map them into a thin shell [STAR_SHELL_INNER, STAR_SHELL_OUTER]
// AU around the celestial sphere via a logarithmic interpolation on the
// light-year value. Effect: visible parallax when the camera orbits, without
// breaking the planets < stars depth ordering. The numbers shown in the UI
// stay the *real* light-years — the shell is purely a rendering artifice.
const STAR_SHELL_INNER_AU = 95;
const STAR_SHELL_OUTER_AU = 110;
const STAR_SHELL_MIN_LY = 4;
const STAR_SHELL_MAX_LY = 3000;
const STAR_SHELL_LOG_MIN = Math.log10(STAR_SHELL_MIN_LY);
const STAR_SHELL_LOG_RANGE =
  Math.log10(STAR_SHELL_MAX_LY) - STAR_SHELL_LOG_MIN;

/**
 * Converts a distance in light-years to the radius (meters) at which the
 * star is placed in the rendering shell. Logarithmic interpolation:
 *
 *   4 ly    → 95 AU
 *   30 ly   → ~99 AU
 *   300 ly  → ~106 AU
 *   3000 ly → 110 AU
 *
 * Values outside [4, 3000] ly are clamped (very few stars: Proxima Centauri
 * on the close side, Deneb-class supergiants on the far side).
 */
export function starShellRadiusM(distanceLy: number): number {
  const clamped = Math.max(
    STAR_SHELL_MIN_LY,
    Math.min(STAR_SHELL_MAX_LY, distanceLy),
  );
  const t = (Math.log10(clamped) - STAR_SHELL_LOG_MIN) / STAR_SHELL_LOG_RANGE;
  const radiusAU =
    STAR_SHELL_INNER_AU + t * (STAR_SHELL_OUTER_AU - STAR_SHELL_INNER_AU);
  return radiusAU * AU_KM * 1000;
}

// Expanded shell used by the Side View feature. Same logarithmic mapping
// over [4, 3000] ly, but stretched across [50, 800] AU so the depth spread
// becomes visually striking when seen from the side. This breaks the
// planets < stars depth ordering, so it must only be applied to the
// selected constellation — never to the global stars layer.
const SIDE_SHELL_INNER_AU = 50;
const SIDE_SHELL_OUTER_AU = 800;

export function starShellRadiusMExpanded(distanceLy: number): number {
  const clamped = Math.max(
    STAR_SHELL_MIN_LY,
    Math.min(STAR_SHELL_MAX_LY, distanceLy),
  );
  const t = (Math.log10(clamped) - STAR_SHELL_LOG_MIN) / STAR_SHELL_LOG_RANGE;
  const radiusAU =
    SIDE_SHELL_INNER_AU + t * (SIDE_SHELL_OUTER_AU - SIDE_SHELL_INNER_AU);
  return radiusAU * AU_KM * 1000;
}
