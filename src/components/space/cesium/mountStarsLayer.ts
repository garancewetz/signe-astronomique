import {
  ArcType,
  Cartesian2,
  Color,
  HorizontalOrigin,
  LabelStyle,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';
import {
  CONSTELLATION_CATALOG,
  isZodiacal,
  abbrToZodiacal,
  type CatalogStar,
} from '../../../data/constellationCatalog';
import { CONSTELLATION_LORE } from '../../../utils/constellationLore';
import { raDecToEcef, CELESTIAL_SPHERE_KM } from '../../../utils/skyCoordinates';
import type { IauConstellation } from '../../../utils/astroEngine';

const SPHERE_RADIUS_M = CELESTIAL_SPHERE_KM * 1000;
const MAGNITUDE_LIMIT = 6.0;

interface MountOptions {
  /** GMST en radians pour la rotation ECI→ECEF */
  gmstRad: number;
  /** Constellation où se trouve le Soleil natal — surlignée */
  highlight: IauConstellation | null;
  /**
   * Traits reliant les étoiles et libellés des constellations zodiacales.
   * Si faux : uniquement les points (étoiles).
   */
  showConstellationArt: boolean;
}

/**
 * Monte les 31 constellations du catalogue ICRS J2000 sur la sphère céleste
 * géocentrique en ECEF. Convention de rendu :
 *
 * - **Toutes** les étoiles (mag ≤ 6) sont rendues comme points,
 *   taille proportionnelle à la magnitude. Les zodiacales en blanc plein,
 *   les non-zodiacales en blanc cassé semi-transparent (densité d'ambiance,
 *   pas de pollution visuelle).
 * - **Seules** les 13 zodiacales peuvent recevoir des lignes de pattern (cyan) et un
 *   label — si `showConstellationArt`. La constellation native (highlight) est rehaussée.
 *
 * Retourne une fonction de cleanup qui retire toutes les entités créées.
 */
export function mountStarsLayer(viewer: Viewer, opts: MountOptions): () => void {
  const created: Entity[] = [];
  const { gmstRad, highlight, showConstellationArt } = opts;
  const magnitudeLimit = MAGNITUDE_LIMIT;

  for (const c of CONSTELLATION_CATALOG) {
    const zodiacal = isZodiacal(c.abbreviation);
    const native = abbrToZodiacal(c.abbreviation) === highlight;

    const positions = c.stars.map((s) =>
      raDecToEcef(s.ra, s.dec, gmstRad, SPHERE_RADIUS_M),
    );

    // Étoiles
    c.stars.forEach((star, i) => {
      if (star.mag > magnitudeLimit) return;
      created.push(
        viewer.entities.add({
          position: positions[i],
          point: {
            pixelSize: pixelSizeFor(star.mag, zodiacal),
            color: zodiacal ? Color.WHITE : Color.WHITE.withAlpha(0.5),
          },
          properties: {
            kind: 'star',
            name: star.name,
            constellation: c.name,
            mag: star.mag,
          },
        }),
      );
    });

    // Lignes de pattern : zodiacales seulement (même interrupteur que les étiquettes des astres)
    if (showConstellationArt && zodiacal) {
      const lineColor = native
        ? Color.fromCssColorString('#67e8f9').withAlpha(0.95)
        : Color.fromCssColorString('#67e8f9').withAlpha(0.5);
      const lineWidth = native ? 1.6 : 0.9;

      for (const [a, b] of c.lines) {
        const sa = c.stars[a];
        const sb = c.stars[b];
        if (sa.mag > magnitudeLimit || sb.mag > magnitudeLimit) continue;
        created.push(
          viewer.entities.add({
            polyline: {
              positions: [positions[a], positions[b]],
              width: lineWidth,
              arcType: ArcType.NONE,
              material: lineColor,
            },
          }),
        );
      }
    }

    // Label : zodiacales seulement, posé sur l'étoile la plus brillante
    if (showConstellationArt && zodiacal) {
      const brightest = brightestStar(c.stars, magnitudeLimit);
      if (brightest != null) {
        const localized = abbrToZodiacal(c.abbreviation);
        const labelText = localized
          ? CONSTELLATION_LORE[localized].fr
          : c.name;
        const labelColor = native
          ? Color.fromCssColorString('#a5f3fc')
          : Color.fromCssColorString('#67e8f9').withAlpha(0.7);
        created.push(
          viewer.entities.add({
            position: positions[brightest],
            label: {
              text: labelText,
              font: native
                ? "600 13px 'JetBrains Mono', monospace"
                : "11px 'JetBrains Mono', monospace",
              fillColor: labelColor,
              style: LabelStyle.FILL,
              verticalOrigin: VerticalOrigin.BOTTOM,
              horizontalOrigin: HorizontalOrigin.LEFT,
              pixelOffset: new Cartesian2(8, -8),
            },
          }),
        );
      }
    }
  }

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}

function brightestStar(stars: CatalogStar[], magnitudeLimit: number): number | null {
  let best = -1;
  let bestMag = Infinity;
  stars.forEach((s, i) => {
    if (s.mag <= magnitudeLimit && s.mag < bestMag) {
      bestMag = s.mag;
      best = i;
    }
  });
  return best === -1 ? null : best;
}

function pixelSizeFor(mag: number, zodiacal: boolean): number {
  // mag 0 → ~7px, mag 6 → ~1.5px
  const base = Math.min(7, Math.max(1.5, 7 - mag));
  return zodiacal ? base : base * 0.85;
}
