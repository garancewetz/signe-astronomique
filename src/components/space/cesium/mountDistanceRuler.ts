import {
  ArcType,
  Cartesian2,
  Cartesian3,
  Color,
  DistanceDisplayCondition,
  HorizontalOrigin,
  LabelStyle,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';
import { findConstellation } from '../../../data/constellationCatalog';
import { starShellRadiusMExpanded } from '../../../utils/skyCoordinates';
import { constellationAxis, sideViewBasis } from './sideView';

interface MountOptions {
  /** IAU 3-letter abbreviation of the focused constellation. */
  constellationAbbr: string;
  /** GMST in radians. */
  gmstRad: number;
}

const TICK_STEP_LY = 50;
const LABEL_EVERY_LY = 100;

// Tick mark heights in world units, expressed as fractions of the
// timeline length so they scale with the constellation. Minor ticks are
// barely visible; major (labelled) ticks are twice as tall and read as
// the axis "stops".
const MINOR_TICK_HALF_FRACTION = 0.008;
const MAJOR_TICK_HALF_FRACTION = 0.018;

const AXIS_END_PADDING_LY = 50; // round the axis up past the farthest star

const TICK_LABEL_FAR_M = 1.5e14;
const RULER_COLOR_HEX = '#cbd5e1';
const RULER_LABEL_HEX = '#e2e8f0';
const EARTH_COLOR_HEX = '#60a5fa';

/**
 * Distance ruler running from Earth (origin) along the constellation's
 * mean direction T, with vertical tick marks every 50 ly and readable
 * labels every 100 ly. Tick lines are oriented along the side-view's
 * world-up vector so they appear strictly vertical in screen space.
 *
 * Earth is anchored as a small blue dot at the origin with its label
 * below the axis to avoid clashing with nearby stars (e.g. Zavijava in
 * Virgo, which sits very close to 0 ly in screen X).
 *
 * Returns a cleanup; silent no-op if the constellation is unknown.
 */
export function mountDistanceRuler(
  viewer: Viewer,
  opts: MountOptions,
): () => void {
  const created: Entity[] = [];
  const constellation = findConstellation(opts.constellationAbbr);
  if (!constellation) return () => {};

  const { T } = constellationAxis(constellation, opts.gmstRad);
  const { up: upWorld } = sideViewBasis(T);

  const farLy = Math.max(...constellation.stars.map((s) => s.distance_ly));
  const axisEndLy =
    Math.ceil((farLy + AXIS_END_PADDING_LY) / TICK_STEP_LY) * TICK_STEP_LY;

  // T is already in ECEF (constellationAxis builds it from gmstRad-rotated
  // unit vectors), so we scale it directly. Routing through raDecToEcef
  // would re-apply the GMST rotation and slide the ruler off the stars.
  const placeAt = (ly: number): Cartesian3 =>
    Cartesian3.multiplyByScalar(T, starShellRadiusMExpanded(ly), new Cartesian3());

  const axisEndPos = placeAt(axisEndLy);
  const timelineLengthM = Cartesian3.magnitude(axisEndPos);
  const minorHalfM = timelineLengthM * MINOR_TICK_HALF_FRACTION;
  const majorHalfM = timelineLengthM * MAJOR_TICK_HALF_FRACTION;

  const tickLabelCondition = new DistanceDisplayCondition(0, TICK_LABEL_FAR_M);

  // Main axis line, light grey, from Earth to slightly past the farthest star.
  created.push(
    viewer.entities.add({
      polyline: {
        positions: [Cartesian3.ZERO, axisEndPos],
        width: 1,
        arcType: ArcType.NONE,
        material: Color.fromCssColorString(RULER_COLOR_HEX).withAlpha(0.55),
      },
    }),
  );

  // Tick marks every 50 ly, with a labelled major tick every 100 ly.
  // Major-tick labels alternate above / below the axis (even index up,
  // odd index down) so consecutive labels never collide horizontally —
  // and so they stay clear of the exploded star labels which use
  // ±18..±50 px lanes around the same axis.
  const STAGGER_OFFSET_PX = 22;
  let majorIndex = 0;
  for (let ly = TICK_STEP_LY; ly <= axisEndLy; ly += TICK_STEP_LY) {
    const isMajor = ly % LABEL_EVERY_LY === 0;
    const center = placeAt(ly);
    const halfM = isMajor ? majorHalfM : minorHalfM;
    const tickStart = Cartesian3.add(
      center,
      Cartesian3.multiplyByScalar(upWorld, -halfM, new Cartesian3()),
      new Cartesian3(),
    );
    const tickEnd = Cartesian3.add(
      center,
      Cartesian3.multiplyByScalar(upWorld, +halfM, new Cartesian3()),
      new Cartesian3(),
    );
    created.push(
      viewer.entities.add({
        polyline: {
          positions: [tickStart, tickEnd],
          width: isMajor ? 1.4 : 1,
          arcType: ArcType.NONE,
          material: Color.fromCssColorString(RULER_COLOR_HEX).withAlpha(
            isMajor ? 0.85 : 0.5,
          ),
        },
      }),
    );

    if (isMajor) {
      const above = majorIndex % 2 === 0;
      created.push(
        viewer.entities.add({
          position: center,
          label: {
            text: `${ly} al`,
            font: "10px 'JetBrains Mono', monospace",
            fillColor: Color.fromCssColorString(RULER_LABEL_HEX),
            style: LabelStyle.FILL,
            verticalOrigin: above ? VerticalOrigin.BOTTOM : VerticalOrigin.TOP,
            horizontalOrigin: HorizontalOrigin.CENTER,
            pixelOffset: new Cartesian2(0, above ? -STAGGER_OFFSET_PX : +STAGGER_OFFSET_PX),
            distanceDisplayCondition: tickLabelCondition,
          },
        }),
      );
      majorIndex += 1;
    }
  }

  // Earth: small blue dot at the origin, with its label parked *below*
  // the axis so it does not collide with stars sitting very near 0 ly
  // (Zavijava in Virgo, Proxima in Centaurus, etc.).
  created.push(
    viewer.entities.add({
      position: Cartesian3.ZERO,
      point: {
        pixelSize: 8,
        color: Color.fromCssColorString(EARTH_COLOR_HEX),
        outlineColor: Color.WHITE.withAlpha(0.8),
        outlineWidth: 1,
        // The timeline crosses the actual Earth ellipsoid; without this
        // the dot would z-fight against the globe surface in side view.
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: 'Terre · 0 al',
        font: "10px 'JetBrains Mono', monospace",
        fillColor: Color.fromCssColorString(RULER_LABEL_HEX),
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.TOP,
        horizontalOrigin: HorizontalOrigin.CENTER,
        // Cesium pixelOffset is y-down, so positive y pushes the label
        // *below* the axis — the goal here.
        pixelOffset: new Cartesian2(0, 14),
        distanceDisplayCondition: tickLabelCondition,
      },
    }),
  );

  // Scale disclaimer below the Earth label. Owns the visual fiction:
  // the 8 px Earth dot would actually be sub-pixel at this camera
  // distance, and the Sun at 1 AU sits within a single pixel of it.
  // Drawing it as a separate label entity (rather than \n in the Earth
  // label) lets us style it differently — italic, smaller, dimmer.
  created.push(
    viewer.entities.add({
      position: Cartesian3.ZERO,
      label: {
        text: 'Terre & Soleil non à l’échelle',
        font: "italic 9px 'JetBrains Mono', monospace",
        fillColor: Color.fromCssColorString(RULER_LABEL_HEX).withAlpha(0.55),
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.TOP,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, 30),
        distanceDisplayCondition: tickLabelCondition,
      },
    }),
  );

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}
