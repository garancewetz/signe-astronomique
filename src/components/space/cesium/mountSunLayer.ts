import {
  Cartesian2,
  Color,
  HorizontalOrigin,
  LabelStyle,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';
import {
  AU_KM,
  raDecToEcef,
  raHoursToDegrees,
} from '../../../utils/skyCoordinates';

interface MountOptions {
  /** Ascension droite du Soleil, en heures (convention astroEngine) */
  raHours: number;
  /** Déclinaison du Soleil, en degrés */
  decDeg: number;
  /** GMST en radians */
  gmstRad: number;
  /** Étiquette texte (le disque visible reste celui de `viewer.scene.sun`). */
  showLabels?: boolean;
}

/**
 * Soleil à 1 UA dans la direction (RA, Dec) géocentrique apparente.
 * Le rendu du Soleil dans le ciel est entièrement celui de Cesium ; on
 * n’ajoute qu’une étiquette optionnelle à cette position pour le reading.
 */
export function mountSunLayer(viewer: Viewer, opts: MountOptions): () => void {
  const { raHours, decDeg, gmstRad, showLabels = false } = opts;

  const position = raDecToEcef(
    raHoursToDegrees(raHours),
    decDeg,
    gmstRad,
    AU_KM * 1000,
  );

  if (!showLabels) {
    return () => {};
  }

  const entity: Entity = viewer.entities.add({
    position,
    label: {
      text: '☀ Soleil',
      font: "10px 'JetBrains Mono', monospace",
      fillColor: Color.fromCssColorString('#fcd34d').withAlpha(0.9),
      style: LabelStyle.FILL,
      verticalOrigin: VerticalOrigin.CENTER,
      horizontalOrigin: HorizontalOrigin.LEFT,
      pixelOffset: new Cartesian2(12, 0),
    },
    properties: { kind: 'sun', name: 'Soleil' },
  });

  return () => {
    viewer.entities.remove(entity);
  };
}
