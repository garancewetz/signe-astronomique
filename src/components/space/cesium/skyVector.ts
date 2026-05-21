import { Cartesian3 } from 'cesium';
import { raDecToEcefXYZ } from '@/features/astronomy';

/**
 * Cesium-typed wrapper around the pure ICRS → ECEF transform in
 * `utils/skyCoordinates`. Lives here because the boundary rule keeps
 * Cesium imports inside `components/space/`.
 *
 * @param raDeg    Right ascension in degrees [0..360)
 * @param decDeg   Declination in degrees [-90..+90]
 * @param gmstRad  GMST in radians
 * @param radiusM  Radius in metres
 */
export function raDecToEcef(
  raDeg: number,
  decDeg: number,
  gmstRad: number,
  radiusM: number,
): Cartesian3 {
  const [x, y, z] = raDecToEcefXYZ(raDeg, decDeg, gmstRad, radiusM);
  return new Cartesian3(x, y, z);
}
