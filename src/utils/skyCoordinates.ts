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
 * Rayon de la sphère céleste où on projette les étoiles (km).
 * = 100 AU, soit deux fois plus loin que Pluton à son aphélie. Cette distance
 * met les étoiles **derrière** tous les corps du système solaire — l'ordre
 * des distances reste donc cohérent (Lune < Soleil < planètes < étoiles) et
 * le depth-test Cesium peut occulter ce qui doit l'être (Terre devant, etc.)
 * sans qu'on ait à truquer l'ordre de rendu.
 */
export const CELESTIAL_SPHERE_KM = 100 * AU_KM;
