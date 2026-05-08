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
import { raDecToEcef, starShellRadiusM } from '../../../utils/skyCoordinates';
import type { IauConstellation } from '../../../utils/astroEngine';

const MAGNITUDE_LIMIT = 6.0;

// Billboard size = pixelSize × this factor. The sprite has a soft halo that
// extends well beyond the bright core, so the on-screen "perceived" star is
// roughly half the billboard footprint.
const STAR_SPRITE_SIZE_FACTOR = 2.2;

// Distance modulation tunables (light-years). The shell math itself lives in
// utils/skyCoordinates; the values below only shape the *visual* fade so
// faraway stars feel deeper without disappearing.
const DISTANCE_PIXEL_REF_LY = 25;
const DISTANCE_PIXEL_FACTOR = 0.07;
const DISTANCE_PIXEL_FLOOR = 0.7;
const DISTANCE_ALPHA_FADE_START_LY = 50;
const DISTANCE_ALPHA_FADE_END_LY = 2500;
const DISTANCE_ALPHA_FADE_DEPTH = 0.15;

interface MountOptions {
  /** GMST in radians for the ICRS→ECEF rotation. */
  gmstRad: number;
  /** Constellation containing the natal Sun — receives a brighter highlight. */
  highlight: IauConstellation | null;
  /**
   * Pattern lines + labels for the zodiacal constellations.
   * If false: only star points are rendered.
   */
  showConstellationArt: boolean;
  /**
   * Multiplicative alpha applied to every entity in this layer. Used by the
   * Side View feature to fade the background sky to ~10 % so the exploded
   * constellation can be the visual focus. Default 1.0 = unchanged.
   */
  dimFactor?: number;
}

/**
 * Renders the 31 catalog constellations (ICRS J2000). Each star sits in a
 * **logarithmic shell** [95–110 AU] whose radial position depends on its
 * real distance (light-years) — breaking the flat-sky illusion and giving
 * a visible parallax when the camera orbits Earth.
 *
 * Convention:
 *
 * - All stars (mag ≤ 6) render as points; size combines magnitude and
 *   distance. Zodiacal stars are pure white, non-zodiacal use a softer
 *   off-white at half opacity (ambient density without visual noise).
 * - The 13 zodiacal constellations get pattern lines (cyan) and a label
 *   when `showConstellationArt` is on. The natal constellation (`highlight`)
 *   is rendered with a brighter accent.
 *
 * Each star entity carries its catalog metadata (kind, name, constellation,
 * magnitude, distance_ly, …) so the click-pick handler in SpaceView can
 * identify it. The user-selected constellation is highlighted by a separate
 * `mountSelectedConstellation` overlay so this layer does not need to remount
 * on selection changes.
 *
 * Returns a cleanup that removes every entity it created.
 */
export function mountStarsLayer(viewer: Viewer, opts: MountOptions): () => void {
  const created: Entity[] = [];
  const { gmstRad, highlight, showConstellationArt, dimFactor = 1.0 } = opts;
  const magnitudeLimit = MAGNITUDE_LIMIT;

  for (const c of CONSTELLATION_CATALOG) {
    const zodiacal = isZodiacal(c.abbreviation);
    const native = abbrToZodiacal(c.abbreviation) === highlight;

    // Each star sits at its own radius inside the log-compressed shell —
    // that radial spread is what produces the parallax effect.
    const positions = c.stars.map((s) =>
      raDecToEcef(s.ra, s.dec, gmstRad, starShellRadiusM(s.distance_ly)),
    );

    // Stars
    const sprite = getStarSpriteUrl();
    c.stars.forEach((star, i) => {
      if (star.mag > magnitudeLimit) return;
      const baseColor = zodiacal ? Color.WHITE : Color.WHITE.withAlpha(0.5);
      const distanceFade = distanceAlphaFactor(star.distance_ly);
      const apparent = pixelSizeFor(star.mag, zodiacal, star.distance_ly);
      const spriteSize = apparent * STAR_SPRITE_SIZE_FACTOR;
      created.push(
        viewer.entities.add({
          position: positions[i],
          billboard: {
            image: sprite,
            color: baseColor.withAlpha(baseColor.alpha * distanceFade * dimFactor),
            width: spriteSize,
            height: spriteSize,
          },
          properties: {
            kind: 'star',
            name: star.name,
            bayer: star.bayer,
            constellation: c.name,
            constellationAbbr: c.abbreviation,
            starIndex: i,
            mag: star.mag,
            distanceLy: star.distance_ly,
          },
        }),
      );
    });

    // Pattern lines: zodiacal constellations only.
    if (showConstellationArt && zodiacal) {
      const lineColor = native
        ? Color.fromCssColorString('#67e8f9').withAlpha(0.95 * dimFactor)
        : Color.fromCssColorString('#67e8f9').withAlpha(0.5 * dimFactor);
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

    // Label: zodiacal constellations, anchored on the brightest star.
    if (showConstellationArt && zodiacal) {
      const brightest = brightestStar(c.stars, magnitudeLimit);
      if (brightest != null) {
        const localized = abbrToZodiacal(c.abbreviation);
        const labelText = localized
          ? CONSTELLATION_LORE[localized].fr
          : c.name;
        const labelColor = native
          ? Color.fromCssColorString('#a5f3fc').withAlpha(dimFactor)
          : Color.fromCssColorString('#67e8f9').withAlpha(0.7 * dimFactor);
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

/**
 * Apparent point size in pixels. Combines two signals:
 *  - magnitude (brighter → larger) — perceptual base.
 *  - distance (farther → slightly smaller) — reinforces 3D volume without
 *    hiding bright far-away stars (Deneb…).
 */
function pixelSizeFor(mag: number, zodiacal: boolean, distanceLy: number): number {
  // mag 0 → ~7 px, mag 6 → ~1.5 px
  const base = Math.min(7, Math.max(1.5, 7 - mag));
  const distanceScale =
    1 -
    DISTANCE_PIXEL_FACTOR *
      Math.log10(Math.max(DISTANCE_PIXEL_REF_LY, distanceLy) / DISTANCE_PIXEL_REF_LY);
  const scaled = base * Math.max(DISTANCE_PIXEL_FLOOR, distanceScale);
  return zodiacal ? scaled : scaled * 0.85;
}

/**
 * Soft radial sprite (white core, gaussian-ish falloff to transparent).
 * Generated once on first use and cached as a data URL — every star
 * billboard reuses the same texture, tinted via `billboard.color`.
 */
let starSpriteUrl: string | null = null;
function getStarSpriteUrl(): string {
  if (starSpriteUrl) return starSpriteUrl;
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  starSpriteUrl = canvas.toDataURL('image/png');
  return starSpriteUrl;
}

/**
 * Multiplicative alpha factor by distance. Far stars (>1000 ly) lose ~15%
 * opacity for a depth cue, never enough to make them invisible.
 */
function distanceAlphaFactor(distanceLy: number): number {
  if (distanceLy <= DISTANCE_ALPHA_FADE_START_LY) return 1.0;
  const t =
    (Math.log10(distanceLy) - Math.log10(DISTANCE_ALPHA_FADE_START_LY)) /
    (Math.log10(DISTANCE_ALPHA_FADE_END_LY) - Math.log10(DISTANCE_ALPHA_FADE_START_LY));
  return 1.0 - DISTANCE_ALPHA_FADE_DEPTH * Math.min(1, Math.max(0, t));
}
