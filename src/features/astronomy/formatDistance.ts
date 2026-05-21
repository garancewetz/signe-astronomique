import type { Locale } from '@/i18n';
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
 * Locale-aware distance string. Below 0.1 AU we show kilometres with the
 * locale's thousand grouping; above, astronomical units with adaptive
 * precision (3 fractional digits below 1 AU, 2 above).
 *
 * The 0.1 AU switching point is shared with `formatAU` in BodyInfoHud and
 * with the live camera-distance HUD chip, so all distance readouts in the
 * cockpit pick the same unit at the same threshold.
 */
export function formatDistanceKmOrAU(km: number, locale: Locale): string {
  const au = km / AU_KM;
  const intl = locale === 'en' ? 'en-US' : 'fr-FR';
  if (au < 0.1) {
    return `${Math.round(km).toLocaleString(intl)} km`;
  }
  const unit = locale === 'en' ? 'AU' : 'UA';
  return `${au.toFixed(au < 1 ? 3 : 2)} ${unit}`;
}
