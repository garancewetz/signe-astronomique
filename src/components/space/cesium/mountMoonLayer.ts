import {
  buildModuleUrl,
  Cartesian2,
  Cartesian3,
  Color,
  HorizontalOrigin,
  ImageMaterialProperty,
  LabelStyle,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';
import {
  raDecToEcef,
  raHoursToDegrees,
} from '../../../utils/skyCoordinates';
import { visualEllipsoidRadiusMeters } from './bodies';

const MOON_TEXTURE_URI = buildModuleUrl('Assets/Textures/moonSmall.jpg');

interface MountOptions {
  /** RA Lune en heures */
  raHours: number;
  /** Dec Lune en degrés */
  decDeg: number;
  /** Distance Terre-Lune réelle, km (Meeus) */
  distanceKm: number;
  /** Fraction illuminée [0..1] — teinte du label */
  illumination: number;
  /** GMST en radians */
  gmstRad: number;
  /** Étiquette texte à la position géocentrique de la Lune. */
  showLabels?: boolean;
}

/**
 * Lune géocentrique à distance réelle : sphère texturée avec l'asset Cesium
 * embarqué (`Assets/Textures/moonSmall.jpg`, résolu via `buildModuleUrl`).
 */
export function mountMoonLayer(viewer: Viewer, opts: MountOptions): () => void {
  const { raHours, decDeg, distanceKm, illumination, gmstRad, showLabels = false } = opts;

  const position = raDecToEcef(
    raHoursToDegrees(raHours),
    decDeg,
    gmstRad,
    distanceKm * 1000,
  );

  const distM = Cartesian3.magnitude(position);
  const r = visualEllipsoidRadiusMeters('moon', distM);
  const radii = new Cartesian3(r, r, r);

  const lit = 0.25 + 0.75 * illumination;
  const moonColor = new Color(
    0.88 * lit + 0.12,
    0.90 * lit + 0.10,
    0.94 * lit + 0.08,
    1,
  );

  const entity: Entity = viewer.entities.add({
    position,
    ellipsoid: {
      radii,
      material: new ImageMaterialProperty({ image: MOON_TEXTURE_URI }),
    },
    ...(showLabels
      ? {
          label: {
            text: '☾ Lune',
            font: "10px 'JetBrains Mono', monospace",
            fillColor: moonColor.withAlpha(0.95),
            style: LabelStyle.FILL,
            verticalOrigin: VerticalOrigin.CENTER,
            horizontalOrigin: HorizontalOrigin.LEFT,
            pixelOffset: new Cartesian2(10, 0),
          },
        }
      : {}),
    properties: {
      kind: 'moon',
      name: 'Lune',
    },
  });

  return () => {
    viewer.entities.remove(entity);
  };
}
