import { EARTH_RADIUS_M } from '@/features/astronomy';

/**
 * Camera distance clamps shared by every input path (mouse/wheel via the
 * screen-space controller, keyboard nav, and the mobile pinch handler).
 * All values are geocentric distances — `Cartesian3.magnitude` of the
 * camera position in ECEF, measured from Earth's centre.
 *
 * Adding a 500 km safe-altitude margin to the mean Earth radius keeps the
 * camera at a comfortable inspection distance — close enough to read
 * landmasses, far enough that perspective and parallax stay manageable
 * and we never crash through the ellipsoid. The max is set well inside
 * the celestial sphere (~6 AU) so the constellation backdrop stays framed.
 */
export const SAFE_ALTITUDE_M = 500_000;
export const MIN_CAMERA_DIST_M = EARTH_RADIUS_M + SAFE_ALTITUDE_M;
export const MAX_CAMERA_DIST_M = 950_000_000;
