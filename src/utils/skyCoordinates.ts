/**
 * Conversions ICRS J2000 → ECEF (Earth-Centered Earth-Fixed) pour le rendu
 * Cesium. La sphère céleste est traitée comme géocentrique : la parallaxe
 * entre la surface et le centre de la Terre est négligeable (~1.8°) à ces
 * échelles, donc une seule projection suffit pour toutes les caméras.
 *
 * Algorithmes : Meeus, Astronomical Algorithms (2e éd.) — chapitres 12 (GMST)
 * et 13 (transformations équatoriales). On ignore précession et nutation
 * (erreur < 0.5° / siècle, invisible à l'œil nu pour des constellations).
 */

import { Cartesian3 } from 'cesium';
import { toJulianDay } from './astroEngine';

const DEG = Math.PI / 180;

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Greenwich Mean Sidereal Time, degrés [0..360) — Meeus 12.4. */
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
 * Direction (RA, Dec) ICRS → position ECEF à un rayon donné.
 *
 * Rotation ECI→ECEF : R_z(-GMST). Les coordonnées catalogue J2000 sont
 * traitées comme ICRS apparentes (précession négligée).
 *
 * @param raDeg    Ascension droite en degrés [0..360)
 * @param decDeg   Déclinaison en degrés [-90..+90]
 * @param gmstRad  GMST en radians (cf. gmstRadians)
 * @param radiusM  Rayon en mètres (distance de l'objet au centre Terre)
 */
export function raDecToEcef(
  raDeg: number,
  decDeg: number,
  gmstRad: number,
  radiusM: number,
): Cartesian3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const xi = Math.cos(dec) * Math.cos(ra);
  const yi = Math.cos(dec) * Math.sin(ra);
  const zi = Math.sin(dec);
  const c = Math.cos(gmstRad);
  const s = Math.sin(gmstRad);
  const xe = xi * c + yi * s;
  const ye = -xi * s + yi * c;
  return new Cartesian3(xe * radiusM, ye * radiusM, zi * radiusM);
}

/** Conversion heures décimales → degrés (RA dans astroEngine est en heures). */
export const raHoursToDegrees = (raHours: number): number => raHours * 15;

/** Une unité astronomique en kilomètres. */
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
