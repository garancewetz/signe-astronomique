import { AU_KM } from './skyCoordinates';

/**
 * Mean Earth radius (meters). Used wherever we need to turn a geocentric
 * distance (`Cartesian3.magnitude(position)`) into an altitude-above-surface
 * that matches everyday intuition. Mean rather than equatorial: the ~22 km
 * ellipsoid difference is invisible at the precision we display, and the
 * camera's safe-altitude clamps use the same value to stay consistent.
 */
export const EARTH_RADIUS_M = 6_371_000;

/**
 * Distance string. Below 0.1 AU we show kilometres with French thousand
 * grouping; above, astronomical units (UA) with adaptive
 * precision (3 fractional digits below 1 AU, 2 above).
 *
 * The 0.1 AU switching point is shared with `formatAU` in BodyInfoHud and
 * with the live camera-distance HUD chip, so all distance readouts in the
 * cockpit pick the same unit at the same threshold.
 */
export function formatDistanceKmOrAU(km: number): string {
  const au = km / AU_KM;
  if (au < 0.1) {
    return `${Math.round(km).toLocaleString('fr-FR')} km`;
  }
  return `${au.toFixed(au < 1 ? 3 : 2)} UA`;
}
