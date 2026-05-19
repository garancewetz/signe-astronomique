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
  raHoursToDegrees,
} from '../../../utils/skyCoordinates';
import { raDecToEcef } from './skyVector';
import type { IauConstellation } from '../../../utils/astroEngine';

interface MountOptions {
  /** Sun right-ascension in hours (astroEngine convention). */
  raHours: number;
  /** Sun declination in degrees. */
  decDeg: number;
  /** GMST in radians. */
  gmstRad: number;
  /** IAU constellation the Sun is currently in. */
  constellation: IauConstellation;
  /** Localized display name (e.g. "Soleil"/"Sun") for the in-scene label. */
  displayName: string;
  /** Render the textual label next to the disk. */
  showLabels?: boolean;
}

/**
 * Sun at 1 AU along its apparent geocentric (RA, Dec). The visible disk is
 * Cesium's built-in `viewer.scene.sun`; we always add an entity at the same
 * position so click-pick has a target. The point is fully transparent but
 * generously sized so a user clicking the visible disk lands on it.
 */
export function mountSunLayer(viewer: Viewer, opts: MountOptions): () => void {
  const { raHours, decDeg, gmstRad, constellation, displayName, showLabels = false } = opts;

  const position = raDecToEcef(
    raHoursToDegrees(raHours),
    decDeg,
    gmstRad,
    AU_KM * 1000,
  );

  const entity: Entity = viewer.entities.add({
    position,
    point: {
      pixelSize: 28,
      color: Color.TRANSPARENT,
      // Without this the proxy is depth-clipped behind the celestial sphere
      // and the click-pick misses on certain camera angles.
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    ...(showLabels
      ? {
          label: {
            text: `☀ ${displayName}`,
            font: "10px 'JetBrains Mono', monospace",
            fillColor: Color.fromCssColorString('#fcd34d').withAlpha(0.9),
            style: LabelStyle.FILL,
            verticalOrigin: VerticalOrigin.CENTER,
            horizontalOrigin: HorizontalOrigin.LEFT,
            pixelOffset: new Cartesian2(12, 0),
          },
        }
      : {}),
    properties: {
      kind: 'sun',
      name: displayName,
      constellation,
      raHours,
      decDeg,
    },
  });

  return () => {
    viewer.entities.remove(entity);
  };
}
