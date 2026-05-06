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
  raDecToEcef,
} from '../../../utils/skyCoordinates';

const SPHERE_RADIUS_M = CELESTIAL_SPHERE_KM * 1000;
const DEG = Math.PI / 180;
// WGS84 polar radius, with a small outward bump so the axis terminates just
// above the surface tile rather than Z-fighting with it.
const EARTH_POLAR_RADIUS_M = 6_356_752 * 1.002;

interface MountOptions {
  /** GMST en radians de la date courante. */
  gmstRad: number;
  /** Obliquité de l'écliptique en degrés (~23.44°). */
  obliquityDeg: number;
}

/**
 * Lignes de référence pédagogiques sur la sphère céleste.
 *
 * 1. **Axe de rotation terrestre** (Z en ECEF par construction). Du pôle Sud
 *    céleste au pôle Nord céleste (vers Polaris). Marque visuellement
 *    l'orientation de la Terre dans l'espace.
 *
 * 2. **Équateur céleste** : grand cercle Dec = 0 sur la sphère céleste.
 *    Projection du plan équatorial terrestre.
 *
 * 3. **Écliptique** : grand cercle Lat écliptique = 0, incliné de l'obliquité
 *    par rapport à l'équateur céleste. C'est le chemin apparent du Soleil.
 *    Toutes les planètes restent dans une bande étroite autour de cette ligne.
 *
 * Le rendu en ECEF avec GMST garantit que ces lignes restent calées sur les
 * étoiles : équateur et écliptique sont fixes en ICRS, donc tournent dans le
 * même sens que les constellations quand on change de date.
 */
export function mountReferenceLines(
  viewer: Viewer,
  opts: MountOptions,
): () => void {
  const created: Entity[] = [];
  const { gmstRad, obliquityDeg } = opts;

  // ─── 1. Axe de rotation terrestre ────────────────────────────────────────
  // En ECEF, l'axe est strictement Z. On le rend en deux segments — pôle Sud
  // céleste → surface Sud, et surface Nord → pôle Nord céleste — pour que la
  // Terre occulte naturellement la portion intérieure. Une polyligne unique
  // qui traverse le globe « phase » à travers la texture (depth-test mou des
  // polylines Cesium contre le terrain).
  const axisColor = Color.fromCssColorString('#fde68a').withAlpha(0.55);
  const axisSegments: [Cartesian3, Cartesian3][] = [
    [
      new Cartesian3(0, 0, -SPHERE_RADIUS_M),
      new Cartesian3(0, 0, -EARTH_POLAR_RADIUS_M),
    ],
    [
      new Cartesian3(0, 0, EARTH_POLAR_RADIUS_M),
      new Cartesian3(0, 0, SPHERE_RADIUS_M),
    ],
  ];
  for (const positions of axisSegments) {
    created.push(
      viewer.entities.add({
        polyline: {
          positions,
          width: 1.5,
          arcType: ArcType.NONE,
          material: axisColor,
        },
        properties: { kind: 'guide', name: 'Axe terrestre' },
      }),
    );
  }
  // Label "Polaris" au pôle Nord céleste
  created.push(
    viewer.entities.add({
      position: new Cartesian3(0, 0, SPHERE_RADIUS_M * 0.98),
      label: {
        text: 'POLARIS / NORD CÉLESTE',
        font: "10px 'JetBrains Mono', monospace",
        fillColor: axisColor,
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, -4),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    }),
  );
  created.push(
    viewer.entities.add({
      position: new Cartesian3(0, 0, -SPHERE_RADIUS_M * 0.98),
      label: {
        text: 'SUD CÉLESTE',
        font: "10px 'JetBrains Mono', monospace",
        fillColor: axisColor,
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.TOP,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, 4),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    }),
  );

  // ─── 2. Équateur céleste (Dec = 0) ───────────────────────────────────────
  const equatorColor = Color.fromCssColorString('#60a5fa').withAlpha(0.45);
  const equatorPositions: Cartesian3[] = [];
  for (let raDeg = 0; raDeg <= 360; raDeg += 2) {
    equatorPositions.push(
      raDecToEcef(raDeg, 0, gmstRad, SPHERE_RADIUS_M),
    );
  }
  created.push(
    viewer.entities.add({
      polyline: {
        positions: equatorPositions,
        width: 1,
        arcType: ArcType.NONE,
        material: equatorColor,
      },
      properties: { kind: 'guide', name: 'Équateur céleste' },
    }),
  );
  // Label sur l'équateur, à RA = 90° (loin du label écliptique pour ne pas se chevaucher)
  created.push(
    viewer.entities.add({
      position: raDecToEcef(90, 0, gmstRad, SPHERE_RADIUS_M),
      label: {
        text: 'ÉQUATEUR CÉLESTE',
        font: "10px 'JetBrains Mono', monospace",
        fillColor: equatorColor,
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.CENTER,
        horizontalOrigin: HorizontalOrigin.LEFT,
        pixelOffset: new Cartesian2(8, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    }),
  );

  // ─── 3. Écliptique (chemin apparent du Soleil) ───────────────────────────
  // Paramétrage : pour chaque longitude écliptique λ, on convertit (λ, β=0)
  // vers (RA, Dec) avec l'obliquité ε :
  //   sin Dec = sin β cos ε + cos β sin ε sin λ  (β=0 → sin ε sin λ)
  //   tan RA  = (sin λ cos ε - tan β sin ε) / cos λ  (β=0 → cos ε tan λ)
  const eps = obliquityDeg * DEG;
  const eclipticColor = Color.fromCssColorString('#fbbf24').withAlpha(0.55);
  const eclipticPositions: Cartesian3[] = [];
  for (let lonDeg = 0; lonDeg <= 360; lonDeg += 2) {
    const lon = lonDeg * DEG;
    const sinDec = Math.sin(eps) * Math.sin(lon);
    const dec = Math.asin(sinDec);
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lon), Math.cos(lon));
    eclipticPositions.push(
      raDecToEcef(
        ((ra / DEG) + 360) % 360,
        dec / DEG,
        gmstRad,
        SPHERE_RADIUS_M,
      ),
    );
  }
  created.push(
    viewer.entities.add({
      polyline: {
        positions: eclipticPositions,
        width: 1.4,
        arcType: ArcType.NONE,
        material: eclipticColor,
      },
      properties: { kind: 'guide', name: 'Écliptique' },
    }),
  );
  // Label sur l'écliptique au solstice d'été : λ = 90°, point d'altitude
  // maximale par rapport à l'équateur céleste — éloigné du label équateur.
  const summerSolstice = (() => {
    const lon = 90 * DEG;
    const sinDec = Math.sin(eps) * Math.sin(lon);
    const dec = Math.asin(sinDec);
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lon), Math.cos(lon));
    return raDecToEcef(
      ((ra / DEG) + 360) % 360,
      dec / DEG,
      gmstRad,
      SPHERE_RADIUS_M,
    );
  })();
  created.push(
    viewer.entities.add({
      position: summerSolstice,
      label: {
        text: 'ÉCLIPTIQUE',
        font: "10px 'JetBrains Mono', monospace",
        fillColor: eclipticColor,
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.LEFT,
        pixelOffset: new Cartesian2(8, -8),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    }),
  );

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}
