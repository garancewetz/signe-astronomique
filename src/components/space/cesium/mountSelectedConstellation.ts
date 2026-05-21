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
  abbrToZodiacal,
  findConstellation,
  type CatalogStar,
} from '@/features/astronomy';
import { CONSTELLATION_LORE } from '../../../utils/constellationLore';
import { starShellRadiusM } from '@/features/astronomy';
import { raDecToEcef } from './skyVector';

const MAGNITUDE_LIMIT = 6.0;

interface MountOptions {
  /** IAU 3-letter abbreviation of the constellation to highlight. */
  constellationAbbr: string;
  /** GMST in radians for the ICRS→ECEF rotation. */
  gmstRad: number;
}

/**
 * Bright pattern overlay for the user-selected constellation. Drawn on top
 * of the always-on stars/zodiac art so the user sees the full pattern even
 * for non-zodiacal constellations and regardless of the global label
 * toggle. Kept as a small standalone layer so changing the selection does
 * not force a full remount of stars/sun/moon/planets.
 */
export function mountSelectedConstellation(
  viewer: Viewer,
  opts: MountOptions,
): () => void {
  const created: Entity[] = [];
  const constellation = findConstellation(opts.constellationAbbr);
  if (!constellation) return () => {};

  const positions = constellation.stars.map((s) =>
    raDecToEcef(s.ra, s.dec, opts.gmstRad, starShellRadiusM(s.distance_ly)),
  );

  const lineColor = Color.fromCssColorString('#a5f3fc').withAlpha(1.0);

  for (const [a, b] of constellation.lines) {
    const sa = constellation.stars[a];
    const sb = constellation.stars[b];
    if (sa.mag > MAGNITUDE_LIMIT || sb.mag > MAGNITUDE_LIMIT) continue;
    created.push(
      viewer.entities.add({
        polyline: {
          positions: [positions[a], positions[b]],
          width: 1.8,
          arcType: ArcType.NONE,
          material: lineColor,
        },
      }),
    );
  }

  const brightest = brightestStar(constellation.stars);
  if (brightest != null) {
    const localized = abbrToZodiacal(constellation.abbreviation);
    const labelText = localized
      ? CONSTELLATION_LORE[localized].fr
      : constellation.name;
    created.push(
      viewer.entities.add({
        position: positions[brightest],
        label: {
          text: labelText,
          font: "600 13px 'JetBrains Mono', monospace",
          fillColor: Color.fromCssColorString('#e0f2fe'),
          style: LabelStyle.FILL,
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.LEFT,
          pixelOffset: new Cartesian2(8, -8),
        },
      }),
    );
  }

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}

function brightestStar(stars: CatalogStar[]): number | null {
  let best = -1;
  let bestMag = Infinity;
  stars.forEach((s, i) => {
    if (s.mag <= MAGNITUDE_LIMIT && s.mag < bestMag) {
      bestMag = s.mag;
      best = i;
    }
  });
  return best === -1 ? null : best;
}
