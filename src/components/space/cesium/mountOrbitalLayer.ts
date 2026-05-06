import { Cartesian3, Color, PointPrimitiveCollection, type Viewer } from 'cesium';
import { gstime, propagate } from 'satellite.js';
import type { OrbitalCategory, OrbitalSat } from '../../../hooks/useOrbitalPopulation';
import { ORBITAL_CATEGORIES } from '../../../data/orbitalCategories';

// Cesium Color objects are derived from the shared palette so the legend
// dots and the rendered points cannot drift apart.
const CATEGORY_COLOR: Record<OrbitalCategory, Color> = Object.fromEntries(
  Object.entries(ORBITAL_CATEGORIES).map(([k, v]) => [
    k,
    Color.fromCssColorString(v.hex).withAlpha(v.alpha),
  ]),
) as Record<OrbitalCategory, Color>;

// SGP4 batch tick interval. 1 s gives visually smooth motion at orbital
// distances (ISS subtends ~0.044°/s from 10 000 km) while keeping the burst
// well under the 16 ms frame budget even for 4 000 satellites.
const TICK_MS = 1000;

/**
 * Renders the full orbital population as a single PointPrimitiveCollection.
 *
 * Satellites are filtered at mount time:
 *  - birthYear = null  → show everything (Modern Clutter mode)
 *  - birthYear = N     → show only sats launched ≤ N (Historical View mode)
 *
 * Positions are updated every TICK_MS via setInterval, decoupled from the
 * Cesium render loop so frame delivery is never blocked.
 *
 * Always propagates to `new Date()` — this is a live overlay, not a natal
 * snapshot, even when viewed alongside a historical reading.
 */
export function mountOrbitalLayer(
  viewer: Viewer,
  satellites: OrbitalSat[],
  birthYear: number | null,
): () => void {
  const visible = birthYear !== null
    ? satellites.filter(
        (s) => s.launchYear !== null && s.launchYear <= birthYear,
      )
    : satellites;

  if (visible.length === 0) return () => {};

  const collection = new PointPrimitiveCollection();
  viewer.scene.primitives.add(collection);

  const points = visible.map((sat) =>
    collection.add({
      position: Cartesian3.ZERO,
      color: CATEGORY_COLOR[sat.category],
      pixelSize: ORBITAL_CATEGORIES[sat.category].pixelSize,
      show: false,
    }),
  );

  function tick() {
    const now = new Date();
    const gmst = gstime(now);
    const cosG = Math.cos(gmst);
    const sinG = Math.sin(gmst);

    for (let i = 0; i < visible.length; i++) {
      const result = propagate(visible[i].satrec, now);
      const eci = result?.position;
      if (
        !eci ||
        typeof eci === 'boolean' ||
        !Number.isFinite(eci.x) ||
        !Number.isFinite(eci.y) ||
        !Number.isFinite(eci.z)
      ) {
        continue;
      }
      // ECI → ECEF rotation by -GMST around Z (same convention as relic layer).
      const xM = (eci.x * cosG + eci.y * sinG) * 1000;
      const yM = (-eci.x * sinG + eci.y * cosG) * 1000;
      const zM = eci.z * 1000;
      points[i].position = new Cartesian3(xM, yM, zM);
      points[i].show = true;
    }
  }

  tick(); // populate immediately on enable
  const intervalId = window.setInterval(tick, TICK_MS);

  return () => {
    window.clearInterval(intervalId);
    viewer.scene.primitives.remove(collection);
  };
}
