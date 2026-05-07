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
  findConstellation,
  type CatalogConstellation,
} from '../../../data/constellationCatalog';
import {
  raDecToEcef,
  starShellRadiusM,
  starShellRadiusMExpanded,
} from '../../../utils/skyCoordinates';

interface MountOptions {
  /** IAU 3-letter abbreviation of the constellation to materialise. */
  constellationAbbr: string;
  /** GMST in radians for the ICRS→ECEF rotation. */
  gmstRad: number;
  /**
   * If true, use the expanded log shell ([50, 800] AU) so the depth
   * vectors align with the exploded constellation in Side View.
   * Default false = compact log shell ([95, 110] AU) for Earth view.
   */
  useExpandedShell?: boolean;
}

/**
 * "Depth projection": draws a thin, semi-transparent vector from Earth's
 * centre to each star of the selected constellation.
 *
 * Pedagogical purpose: these lines have wildly different lengths (radii) —
 * visual proof that the "lines" connecting the stars of a constellation
 * actually cross hundreds of light-years of depth.
 *
 * Returns a cleanup; silent no-op if the constellation is unknown.
 */
export function mountDepthLines(
  viewer: Viewer,
  opts: MountOptions,
): () => void {
  const created: Entity[] = [];
  const constellation: CatalogConstellation | null = findConstellation(
    opts.constellationAbbr,
  );
  if (!constellation) return () => {};

  const earthCenter = Cartesian3.ZERO;
  const lineColor = Color.fromCssColorString('#a5f3fc').withAlpha(0.32);
  const radiusFor = opts.useExpandedShell
    ? starShellRadiusMExpanded
    : starShellRadiusM;

  for (const star of constellation.stars) {
    const radiusM = radiusFor(star.distance_ly);
    const starPos = raDecToEcef(star.ra, star.dec, opts.gmstRad, radiusM);
    created.push(
      viewer.entities.add({
        polyline: {
          positions: [earthCenter, starPos],
          width: 0.8,
          arcType: ArcType.NONE,
          material: lineColor,
        },
      }),
    );
    // Distance label anchored on the star end of the vector.
    created.push(
      viewer.entities.add({
        position: starPos,
        label: {
          text: formatLightYears(star.distance_ly),
          font: "10px 'JetBrains Mono', monospace",
          fillColor: Color.fromCssColorString('#bae6fd').withAlpha(0.85),
          style: LabelStyle.FILL,
          verticalOrigin: VerticalOrigin.TOP,
          horizontalOrigin: HorizontalOrigin.LEFT,
          pixelOffset: new Cartesian2(10, 6),
        },
      }),
    );
  }

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}

// Shared with StarInfoHud via skyCoordinates would couple a UI string to
// utils/. Inline here for now; if a third call site appears, lift it.
function formatLightYears(ly: number): string {
  if (ly >= 1000) return `${(ly / 1000).toFixed(1)} kal`;
  if (ly >= 100) return `${Math.round(ly)} al`;
  if (ly >= 10) return `${ly.toFixed(0)} al`;
  return `${ly.toFixed(1)} al`;
}
