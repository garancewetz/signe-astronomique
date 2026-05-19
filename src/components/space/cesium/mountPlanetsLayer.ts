import {
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
  AU_KM,
  raHoursToDegrees,
} from '../../../utils/skyCoordinates';
import { raDecToEcef } from './skyVector';
import type { CelestialBody } from '../../../utils/astroEngine';
import type { PlanetId } from '../../../utils/planetEngine';
import { visualEllipsoidRadiusMeters } from './bodies';

interface MountOptions {
  /** Tous les corps célestes du reading. Sun et Moon sont filtrés ici. */
  bodies: CelestialBody[];
  /** GMST en radians */
  gmstRad: number;
  /** Locale-aware display name lookup for planets. */
  nameOf: (id: PlanetId) => string;
  /** Étiquettes texte près des corps. */
  showLabels?: boolean;
}

const PLANET_RENDER_BASE_AU = 2;
const PLANET_RENDER_LOG_FACTOR = 10;

function compressedDistanceAU(realDistAU: number): number {
  return PLANET_RENDER_BASE_AU + Math.log10(1 + realDistAU) * PLANET_RENDER_LOG_FACTOR;
}

/**
 * Planètes : direction RA/Dec exacte, distance affichée comprimée (cf.
 * compressedDistanceAU). Rendu en sphère unie (couleur du body) dont le rayon
 * apparent est calibré pour rester visible depuis l’orbite Terre.
 */
export function mountPlanetsLayer(viewer: Viewer, opts: MountOptions): () => void {
  const { bodies, gmstRad, nameOf, showLabels = true } = opts;
  const created: Entity[] = [];

  const planets = bodies.filter((b) => b.id !== 'sun' && b.id !== 'moon');

  for (const body of planets) {
    if (body.distance == null) continue;
    const planetId = body.id as PlanetId;
    const displayName = nameOf(planetId);

    const position = raDecToEcef(
      raHoursToDegrees(body.ra),
      body.dec,
      gmstRad,
      compressedDistanceAU(body.distance) * AU_KM * 1000,
    );

    const distM = Cartesian3.magnitude(position);
    const r = visualEllipsoidRadiusMeters(planetId, distM);
    const radii = new Cartesian3(r, r, r);

    const color = Color.fromCssColorString(body.color);

    created.push(
      viewer.entities.add({
        position,
        ellipsoid: {
          radii,
          material: color,
        },
        ...(showLabels
          ? {
              label: {
                text: `${body.glyph} ${displayName}`,
                font: "10px 'JetBrains Mono', monospace",
                fillColor: color.withAlpha(0.88),
                style: LabelStyle.FILL,
                verticalOrigin: VerticalOrigin.CENTER,
                horizontalOrigin: HorizontalOrigin.LEFT,
                pixelOffset: new Cartesian2(12, 0),
              },
            }
          : {}),
        properties: {
          kind: 'planet',
          id: planetId,
          name: displayName,
          glyph: body.glyph,
          color: body.color,
          constellation: body.constellation,
          raHours: body.ra,
          decDeg: body.dec,
          distanceAU: body.distance,
        },
      }),
    );
  }

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}
