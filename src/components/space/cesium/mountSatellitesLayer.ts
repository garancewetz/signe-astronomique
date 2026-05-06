import {
  Cartesian2,
  Cartesian3,
  CallbackProperty,
  Color,
  HorizontalOrigin,
  LabelStyle,
  NearFarScalar,
  VerticalOrigin,
  type Entity,
  type PositionProperty,
  type Viewer,
} from 'cesium';
import { gstime, propagate, type SatRec } from 'satellite.js';
import type { ParsedRelic } from '../../../hooks/useSatelliteTracker';

interface MountOptions {
  /** Filtered + parsed relics from useSatelliteTracker. */
  satellites: ParsedRelic[];
  /**
   * Time source for propagation. Called every frame in live mode, once at
   * mount in fixed mode.
   *  - Natal: `() => reading.input.date`
   *  - Live : `() => new Date()`
   */
  getTime: () => Date;
  /**
   * Live mode → position is a CallbackProperty (re-evaluated each render
   * frame), so satellites visibly orbit. Fixed mode → position is computed
   * once and frozen, which is what the natal sky wants.
   */
  live: boolean;
}

/**
 * Orbital relics — pulsing glow points in LEO/MEO around the globe.
 *
 * Coordinate pipeline (per evaluation):
 *   1. satellite.js SGP4 gives us ECI (km) at the requested time.
 *   2. We rotate by -GMST(time) around Z to land in Cesium's ECEF frame.
 *   3. Cesium renders in meters → multiply by 1000.
 *
 * We stick to the manual GMST rotation (consistent with skyCoordinates.ts)
 * rather than `Transforms.computeIcrfToFixedMatrix`, which requires an IERS
 * preload not used elsewhere in the project. `gstime` from satellite.js
 * gives us GMST in radians directly, so it stays self-contained.
 *
 * Last-known position is cached per satellite: when SGP4 fails (numerical
 * decay), we keep showing the satellite at its last good spot rather than
 * having it disappear and reappear.
 */
export function mountSatellitesLayer(
  viewer: Viewer,
  opts: MountOptions,
): () => void {
  const { satellites, getTime, live } = opts;
  if (satellites.length === 0) return () => {};

  const created: Entity[] = [];

  // Shared global pulse: a looping sin(t) feeding pixelSize through a
  // CallbackProperty. One function for every point → near-zero cost.
  const start = performance.now();
  const pulseScale = (base: number, amp: number) =>
    new CallbackProperty(() => {
      const phase = ((performance.now() - start) / 2200) * Math.PI * 2;
      return base + Math.sin(phase) * amp;
    }, false);

  for (const sat of satellites) {
    const { relic, satrec } = sat;

    // Per-satellite cache: the last position SGP4 ever returned successfully.
    // If SGP4 fails (numerical decay, far-from-epoch propagation, …) we
    // hide the entity entirely via `visible` rather than dumping it at the
    // origin (which would put it inside the globe and be confusingly
    // invisible-but-occluding).
    let lastKnown: Cartesian3 | null = computePosition(satrec, getTime());
    let visible: boolean = lastKnown !== null;

    let position: Cartesian3 | PositionProperty;
    if (live) {
      position = new CallbackProperty(() => {
        const next = computePosition(satrec, getTime());
        if (next) {
          lastKnown = next;
          visible = true;
        }
        // Returning the cached value when propagation fails keeps the
        // entity stable across transient glitches; the `show` callback
        // below decides whether it's actually rendered.
        return lastKnown ?? Cartesian3.ZERO;
      }, false) as unknown as PositionProperty;
    } else {
      position = lastKnown ?? Cartesian3.ZERO;
    }

    const glow = Color.fromCssColorString(relic.glowColor);
    const showWhenValid = new CallbackProperty(() => visible, false);

    const entity = viewer.entities.add({
      position,
      point: {
        show: showWhenValid,
        // Soft 8→11 px pulse — perceptible, not distracting.
        pixelSize: pulseScale(9.5, 1.5),
        color: glow.withAlpha(0.95),
        outlineColor: glow.withAlpha(0.35),
        outlineWidth: 3,
        // Stays visible across the full zoom range: full size at relics-
        // view distance (~8 000 km altitude ≈ 1.4e7 m camera-to-target),
        // and only mildly shrunk at the wide orbital view (~1e8 m). The
        // previous calibration shrunk too aggressively at default zoom.
        scaleByDistance: new NearFarScalar(1.4e7, 1.2, 1.5e8, 0.6),
      },
      label: {
        text: relic.name,
        font: "10px 'JetBrains Mono', monospace",
        fillColor: glow.withAlpha(0.95),
        outlineColor: Color.BLACK.withAlpha(0.85),
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.CENTER,
        horizontalOrigin: HorizontalOrigin.LEFT,
        pixelOffset: new Cartesian2(12, 0),
        show: showWhenValid,
        // Labels stay legible at relics-view distance and fade more
        // aggressively at the wide orbital view to avoid clutter.
        scaleByDistance: new NearFarScalar(1.4e7, 1.0, 1.5e8, 0.5),
      },
      properties: {
        kind: 'satellite',
        relicId: relic.id,
        name: relic.name,
        launchDate: relic.launchDate,
        blurb: relic.blurb,
      },
    });

    created.push(entity);
  }

  return () => {
    for (const e of created) viewer.entities.remove(e);
  };
}

/**
 * Propagates a SatRec to the given Date and returns the ECEF Cartesian3
 * (meters) ready for Cesium. Returns null on SGP4 failure so callers can
 * keep their last known position instead of glitching to origin.
 */
function computePosition(satrec: SatRec, date: Date): Cartesian3 | null {
  const result = propagate(satrec, date);
  const eci = result?.position;
  if (
    !eci ||
    typeof eci === 'boolean' ||
    !Number.isFinite(eci.x) ||
    !Number.isFinite(eci.y) ||
    !Number.isFinite(eci.z)
  ) {
    return null;
  }

  // ECI → ECEF: rotation by -GMST around Z. gstime returns radians.
  const gmst = gstime(date);
  const cosG = Math.cos(gmst);
  const sinG = Math.sin(gmst);
  const xEcefKm = eci.x * cosG + eci.y * sinG;
  const yEcefKm = -eci.x * sinG + eci.y * cosG;
  const zEcefKm = eci.z;

  return new Cartesian3(xEcefKm * 1000, yEcefKm * 1000, zEcefKm * 1000);
}
