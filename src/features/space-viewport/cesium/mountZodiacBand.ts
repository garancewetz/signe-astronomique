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
import { COPY } from '@/i18n';
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
/**
 * The band runs parallel to the ecliptic, just south of it, like a ruler laid
 * under the Sun's path: on the ecliptic itself it would cover the Sun.
 */
const BAND_LAT_DEG = -3.5;
/** Boundary ticks span the band, in degrees of ecliptic latitude. */
const TICK_LAT_DEG: [number, number] = [-5.5, -1.5];
/** Labels sit under the band. */
const LABEL_LAT_DEG = -8;

const GOLD = Color.fromCssColorString('#f2cf73');
const GREY = Color.fromCssColorString('#8a93a3');

interface MountOptions {
  gmstRad: number;
  /** Constellation the Sun is in: its stretch of the ecliptic is drawn gold. */
  trueConstellation: IauConstellation;
  /** Sun's sidereal (ICRS) ecliptic longitude: marked on the band, under the Sun. */
  sunLongitude: number;
  /** Constellation label. */
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
 * wrong sign. This band follows the ecliptic, cut at the IAU 1930
 * boundaries with a tick at each one, the true sign's stretch in gold and
 * a dot under the Sun — so the Sun is visibly inside it, however close to
 * the edge.
 */
export function mountZodiacBand(viewer: Viewer, opts: MountOptions): () => void {
  const { gmstRad, trueConstellation, sunLongitude, nameOf } = opts;
  const zonePrefix = COPY.sky.zonePrefix;
  const created: Entity[] = [];
  const boundaries = getIauBoundaries();

  // The reader's own label goes under the band, like the neighbours (above
  // it, it lands on the cyan constellation name), in the half of the
  // stretch away from the Sun so it never lands on the Earth, which sits
  // just below the Sun in the framing. Neighbours keep the middle.
  const labelPosition = (start: number, end: number, isTrue: boolean) => {
    if (!isTrue) return eclipticToEcef((start + end) / 2, LABEL_LAT_DEG, gmstRad);
    const sun = sunLongitude < start ? sunLongitude + 360 : sunLongitude;
    const sunInFirstHalf = sun - start < (end - start) / 2;
    const lon = start + (end - start) * (sunInFirstHalf ? 0.75 : 0.25);
    return eclipticToEcef(lon, LABEL_LAT_DEG, gmstRad);
  };

  boundaries.forEach((b, i) => {
    const next = boundaries[(i + 1) % boundaries.length];
    const end = next.start > b.start ? next.start : next.start + 360;
    const isTrue = b.constellation === trueConstellation;

    // Stretch of ecliptic inside this constellation.
    const positions: Cartesian3[] = [];
    for (let lon = b.start; lon < end; lon += 1) positions.push(eclipticToEcef(lon, BAND_LAT_DEG, gmstRad));
    positions.push(eclipticToEcef(end, BAND_LAT_DEG, gmstRad));
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
            eclipticToEcef(b.start, TICK_LAT_DEG[0], gmstRad),
            eclipticToEcef(b.start, TICK_LAT_DEG[1], gmstRad),
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
        position: labelPosition(b.start, end, isTrue),
        label: {
          // "Zone …" on the reader's stretch: the cyan name next to the star
          // figure is the drawing, this one is the official area.
          text: isTrue ? `${zonePrefix} ${nameOf(b.constellation)}` : nameOf(b.constellation),
          font: isTrue ? "600 13px 'IBM Plex Mono', monospace" : "12px 'IBM Plex Mono', monospace",
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

  // The Sun's foot on the band: links the Sun above to its stretch below.
  created.push(
    viewer.entities.add({
      position: eclipticToEcef(sunLongitude, BAND_LAT_DEG, gmstRad),
      point: {
        pixelSize: 8,
        color: GOLD,
        outlineColor: Color.fromCssColorString('#0b0e14'),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      properties: { kind: 'guide', name: 'Position du Soleil' },
    }),
  );

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}
