import {
  ArcType,
  Cartesian2,
  Cartesian3,
  Color,
  HorizontalOrigin,
  LabelStyle,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';
import {
  CELESTIAL_SPHERE_KM,
  getIauBoundaries,
  type IauConstellation,
} from '@/features/astronomy';
import { raDecToEcef } from './skyVector';

const SPHERE_RADIUS_M = CELESTIAL_SPHERE_KM * 1000;
const DEG = Math.PI / 180;
/** J2000 obliquity: the boundaries and the star catalogue are both ICRS. */
const EPS_J2000 = 23.4392911 * DEG;
/** Half-height of the boundary ticks, in degrees of ecliptic latitude. */
const TICK_DEG = 4;
/** Labels sit this far below the ecliptic, clear of the Sun and planets. */
const LABEL_LAT_DEG = -7;

const GOLD = Color.fromCssColorString('#f2cf73');
const GREY = Color.fromCssColorString('#8a93a3');

interface MountOptions {
  gmstRad: number;
  /** Constellation the Sun is in: its stretch of the ecliptic is drawn gold. */
  trueConstellation: IauConstellation;
  /** Locale-aware constellation label. */
  nameOf: (c: IauConstellation) => string;
}

/** Ecliptic (J2000) → ECEF on the celestial sphere (Meeus 13.3). */
function eclipticToEcef(lonDeg: number, latDeg: number, gmstRad: number): Cartesian3 {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const sinDec = Math.sin(lat) * Math.cos(EPS_J2000)
    + Math.cos(lat) * Math.sin(EPS_J2000) * Math.sin(lon);
  const ra = Math.atan2(
    Math.sin(lon) * Math.cos(EPS_J2000) - Math.tan(lat) * Math.sin(EPS_J2000),
    Math.cos(lon),
  );
  return raDecToEcef(((ra / DEG) + 360) % 360, Math.asin(sinDec) / DEG, gmstRad, SPHERE_RADIUS_M);
}

/**
 * The official territories of the 13 zodiac constellations along the Sun's
 * path. The stick figures only join bright stars; a constellation is a whole
 * area of sky, so a Sun sitting "between two drawings" can look like the
 * wrong sign. This band cuts the ecliptic at the IAU 1930 boundaries, with
 * a tick at each one, and draws the true sign's stretch in gold — so the
 * Sun is visibly inside it, however close to the edge.
 */
export function mountZodiacBand(viewer: Viewer, opts: MountOptions): () => void {
  const { gmstRad, trueConstellation, nameOf } = opts;
  const created: Entity[] = [];
  const boundaries = getIauBoundaries();

  boundaries.forEach((b, i) => {
    const next = boundaries[(i + 1) % boundaries.length];
    const end = next.start > b.start ? next.start : next.start + 360;
    const isTrue = b.constellation === trueConstellation;

    // Stretch of ecliptic inside this constellation.
    const positions: Cartesian3[] = [];
    for (let lon = b.start; lon < end; lon += 1) positions.push(eclipticToEcef(lon, 0, gmstRad));
    positions.push(eclipticToEcef(end, 0, gmstRad));
    created.push(
      viewer.entities.add({
        polyline: {
          positions,
          width: isTrue ? 4 : 1.5,
          arcType: ArcType.NONE,
          material: isTrue ? GOLD.withAlpha(0.85) : GREY.withAlpha(0.45),
        },
        properties: { kind: 'guide', name: `Zone IAU · ${nameOf(b.constellation)}` },
      }),
    );

    // Boundary tick where this constellation starts.
    created.push(
      viewer.entities.add({
        polyline: {
          positions: [
            eclipticToEcef(b.start, -TICK_DEG, gmstRad),
            eclipticToEcef(b.start, TICK_DEG, gmstRad),
          ],
          width: 1.5,
          arcType: ArcType.NONE,
          material: GREY.withAlpha(0.8),
        },
        properties: { kind: 'guide', name: 'Frontière IAU' },
      }),
    );

    // Name under the middle of the stretch.
    created.push(
      viewer.entities.add({
        position: eclipticToEcef((b.start + end) / 2, LABEL_LAT_DEG, gmstRad),
        label: {
          text: nameOf(b.constellation).toUpperCase(),
          font: isTrue ? "600 12px 'IBM Plex Mono', monospace" : "11px 'IBM Plex Mono', monospace",
          fillColor: isTrue ? GOLD : GREY.withAlpha(0.9),
          style: LabelStyle.FILL,
          verticalOrigin: VerticalOrigin.CENTER,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian2(0, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      }),
    );
  });

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}
