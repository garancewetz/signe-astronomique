import {
  ArcType,
  Cartesian2,
  Color,
  HorizontalOrigin,
  LabelStyle,
  PolylineGlowMaterialProperty,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';
import {
  abbrToZodiacal,
  findConstellation,
  type CatalogStar,
} from '@/features/astronomy';
import { loreName } from '../../../utils/constellationLore';
import { starShellRadiusMExpanded } from '@/features/astronomy';
import { raDecToEcef } from './skyVector';
import type { Locale } from '../../../i18n';

const MAGNITUDE_LIMIT = 6.0;

// Vertical lanes available to label-deconfliction, ordered by visual
// priority (closest to the point first). Each value is the px y-offset
// applied to the label; sign drives whether the label sits above (-)
// or below (+) the star. The greedy assignment in `computeStaggerRows`
// always picks the first free lane, so labels stay close to their
// stars unless a horizontal collision forces the algorithm farther out.
const LANE_OFFSETS_PX: number[] = [-18, +18, -34, +34, -50, +50];
const LANE_X_OFFSET_PX = 8;

// Horizontal clearance below which two labels are considered colliding,
// expressed as a fraction of the constellation's distance span (max - min
// in light-years). 18 % is a hand-tuned value that keeps the typical
// 80 px label from overlapping its neighbour at default zoom while
// scaling sensibly across constellations of very different sizes.
const LABEL_GAP_FRACTION = 0.18;

interface MountOptions {
  /** IAU 3-letter abbreviation of the constellation to "explode". */
  constellationAbbr: string;
  /** GMST in radians for the ICRS→ECEF rotation. */
  gmstRad: number;
  /** Active locale for the constellation label. */
  locale: Locale;
}

/**
 * Side View "shattered" constellation: stars at expanded log-shell
 * positions ([50, 800] AU), each tinted on a near-warm / far-cool
 * gradient, with a glowing pattern line and per-star distance labels.
 *
 * The depth gradient + glow lines + size attenuation compound to make
 * the explosion read as 3D even in a void without atmospheric haze.
 *
 * Returns a cleanup; silent no-op if the abbreviation is unknown.
 */
export function mountExplodedConstellation(
  viewer: Viewer,
  opts: MountOptions,
): () => void {
  const created: Entity[] = [];
  const constellation = findConstellation(opts.constellationAbbr);
  if (!constellation) return () => {};

  const positions = constellation.stars.map((s) =>
    raDecToEcef(s.ra, s.dec, opts.gmstRad, starShellRadiusMExpanded(s.distance_ly)),
  );

  // Label deconfliction: stars adjacent in distance project to adjacent
  // horizontal positions on the timeline. We walk the stars sorted by
  // distance and assign each one to the closest free vertical lane,
  // adding new lanes if the preset ones are all occupied. Computed
  // up-front as a Map<index, offset> since the rendering loop iterates
  // by catalog index, not by sort order.
  const stagger = computeStaggerRows(constellation.stars);

  // Stars: bright disc with the depth tint, plus a per-star label so the
  // user can read the actual ly value of each point in the explosion.
  constellation.stars.forEach((star, i) => {
    if (star.mag > MAGNITUDE_LIMIT) return;
    const tint = depthTint(star.distance_ly);
    const labelOffset = stagger.get(i) ?? new Cartesian2(LANE_X_OFFSET_PX, LANE_OFFSETS_PX[0]);
    created.push(
      viewer.entities.add({
        position: positions[i],
        point: {
          pixelSize: explodedPixelSize(star.mag),
          color: tint,
          outlineColor: Color.WHITE.withAlpha(0.4),
          outlineWidth: 0.5,
        },
        label: {
          text: `${star.bayer} ${star.name}\n${formatLightYears(star.distance_ly)}`,
          font: "10px 'JetBrains Mono', monospace",
          fillColor: tint.withAlpha(0.9),
          style: LabelStyle.FILL,
          verticalOrigin: labelOffset.y < 0 ? VerticalOrigin.BOTTOM : VerticalOrigin.TOP,
          horizontalOrigin: HorizontalOrigin.LEFT,
          pixelOffset: labelOffset,
        },
      }),
    );
  });

  // Pattern lines: glow material so the constellation "shape" pops against
  // the dim background. Color stays cyan to match the existing selection
  // overlay convention; the glow power softens the edges visibly.
  const glowMaterial = new PolylineGlowMaterialProperty({
    glowPower: 0.18,
    taperPower: 1.0,
    color: Color.fromCssColorString('#a5f3fc').withAlpha(0.95),
  });
  for (const [a, b] of constellation.lines) {
    const sa = constellation.stars[a];
    const sb = constellation.stars[b];
    if (sa.mag > MAGNITUDE_LIMIT || sb.mag > MAGNITUDE_LIMIT) continue;
    created.push(
      viewer.entities.add({
        polyline: {
          positions: [positions[a], positions[b]],
          width: 4,
          arcType: ArcType.NONE,
          material: glowMaterial,
        },
      }),
    );
  }

  // Constellation name on the brightest exploded star.
  const brightest = brightestStar(constellation.stars);
  if (brightest != null) {
    const localized = abbrToZodiacal(constellation.abbreviation);
    const labelText = localized
      ? loreName(localized, opts.locale).toUpperCase()
      : constellation.name.toUpperCase();
    created.push(
      viewer.entities.add({
        position: positions[brightest],
        label: {
          text: labelText,
          font: "700 14px 'JetBrains Mono', monospace",
          fillColor: Color.fromCssColorString('#e0f2fe'),
          style: LabelStyle.FILL,
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.RIGHT,
          pixelOffset: new Cartesian2(-12, -28),
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

/**
 * Maps a star's distance to a near-warm / far-cool tint. Read by the eye
 * as atmospheric perspective even in a hard vacuum: no color theory,
 * just the established convention from astrophotography & sci-fi UIs.
 */
function depthTint(distanceLy: number): Color {
  const t = (Math.log10(Math.max(4, Math.min(3000, distanceLy))) - Math.log10(4)) /
    (Math.log10(3000) - Math.log10(4));
  const near = Color.fromCssColorString('#fffaf0'); // floral white
  const far = Color.fromCssColorString('#5b9dff'); // cool indigo
  return new Color(
    near.red + (far.red - near.red) * t,
    near.green + (far.green - near.green) * t,
    near.blue + (far.blue - near.blue) * t,
    1.0,
  );
}

function explodedPixelSize(mag: number): number {
  // Slightly larger than normal-mode points so individual stars stay
  // legible across the much wider radial spread.
  return Math.min(9, Math.max(2.5, 8 - mag));
}

/**
 * Greedy label-placement: walk the stars in distance order (= horizontal
 * order on the timeline) and assign each one the first vertical lane
 * whose previously-placed label is at least `minGapLy` away on the X
 * axis. New lanes are appended on demand if the preset palette is full,
 * each one a step further from the timeline than the last.
 *
 * Returned map keys are the star's *original* catalog index — call sites
 * iterate by catalog index, not by sort order.
 */
function computeStaggerRows(stars: CatalogStar[]): Map<number, Cartesian2> {
  if (stars.length === 0) return new Map();

  const distances = stars.map((s) => s.distance_ly);
  const span = Math.max(...distances) - Math.min(...distances);
  // Constellations with all stars at similar depth (small span) still
  // benefit from a non-zero gap so consecutive labels separate. Floor at
  // 30 ly so the absolute spacing stays reasonable.
  const minGapLy = Math.max(30, span * LABEL_GAP_FRACTION);

  interface Lane {
    offsetY: number;
    lastDistance: number; // last star's distance_ly assigned to this lane
  }
  const lanes: Lane[] = LANE_OFFSETS_PX.map((offsetY) => ({
    offsetY,
    lastDistance: -Infinity,
  }));

  const sorted = stars
    .map((star, index) => ({ star, index }))
    .sort((a, b) => a.star.distance_ly - b.star.distance_ly);

  const result = new Map<number, Cartesian2>();
  for (const { star, index } of sorted) {
    let lane = lanes.find((l) => star.distance_ly - l.lastDistance > minGapLy);
    if (!lane) {
      // All preset lanes still hold a too-close label. Add a new one
      // farther from the axis, alternating sides each time.
      const laneIndex = lanes.length;
      const sign = laneIndex % 2 === 0 ? -1 : 1;
      const step = Math.floor(laneIndex / 2) + 4; // continues past LANE_OFFSETS_PX
      lane = { offsetY: sign * step * 16, lastDistance: -Infinity };
      lanes.push(lane);
    }
    lane.lastDistance = star.distance_ly;
    result.set(index, new Cartesian2(LANE_X_OFFSET_PX, lane.offsetY));
  }
  return result;
}

function formatLightYears(ly: number): string {
  if (ly >= 1000) return `${(ly / 1000).toFixed(1)} kal`;
  if (ly >= 100) return `${Math.round(ly)} al`;
  if (ly >= 10) return `${ly.toFixed(0)} al`;
  return `${ly.toFixed(1)} al`;
}
