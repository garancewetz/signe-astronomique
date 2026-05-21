import { Cartesian3, Color, PointPrimitiveCollection, type Viewer } from 'cesium';
import { gstime, propagate } from 'satellite.js';
import type { OrbitalCategory, OrbitalSat } from '../useOrbitalPopulation';
import { ORBITAL_CATEGORIES } from '../data/orbitalCategories';

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

export interface OrbitalLayerHandle {
  /** Immediate teardown — cancels any in-flight fade and removes the collection. */
  dispose: () => void;
  /**
   * Ramp every point's alpha 1 → 0 over `durationMs`, then dispose. Idempotent:
   * subsequent calls are ignored once a fade is in flight or the layer has
   * been disposed. Used by SpaceView to "de-materialize" the modern swarm
   * when the user JUMPs into the past.
   */
  fadeOutAndDispose: (durationMs: number) => void;
}

/**
 * Renders the full orbital population as a single PointPrimitiveCollection.
 *
 * Defense-in-depth filter (kept even though SpaceView already gates by date):
 *  - birthYear = null  → show everything (Modern Clutter mode)
 *  - birthYear = N     → show only sats launched ≤ N (Historical View mode)
 *
 * Positions are updated every TICK_MS via setInterval, decoupled from the
 * Cesium render loop so frame delivery is never blocked. Always propagates
 * to `new Date()` — this is a live overlay, not a natal snapshot.
 */
export function mountOrbitalLayer(
  viewer: Viewer,
  satellites: OrbitalSat[],
  birthYear: number | null,
): OrbitalLayerHandle {
  const visible = birthYear !== null
    ? satellites.filter(
        (s) => s.launchYear !== null && s.launchYear <= birthYear,
      )
    : satellites;

  if (visible.length === 0) {
    return { dispose: () => {}, fadeOutAndDispose: () => {} };
  }

  const collection = new PointPrimitiveCollection();
  viewer.scene.primitives.add(collection);

  const baseAlphas = visible.map((s) => ORBITAL_CATEGORIES[s.category].alpha);
  let alphaScale = 1;
  let disposed = false;
  let fading = false;

  const points = visible.map((sat, i) =>
    collection.add({
      position: Cartesian3.ZERO,
      color: CATEGORY_COLOR[sat.category].withAlpha(baseAlphas[i] * alphaScale),
      pixelSize: ORBITAL_CATEGORIES[sat.category].pixelSize,
      show: false,
    }),
  );

  function applyAlphaScale() {
    for (let i = 0; i < points.length; i++) {
      points[i].color = CATEGORY_COLOR[visible[i].category].withAlpha(
        baseAlphas[i] * alphaScale,
      );
    }
  }

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

  tick();
  const intervalId = window.setInterval(tick, TICK_MS);

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.clearInterval(intervalId);
    if (!viewer.isDestroyed()) {
      viewer.scene.primitives.remove(collection);
    }
  }

  function fadeOutAndDispose(durationMs: number) {
    if (fading || disposed) return;
    fading = true;
    const t0 = performance.now();
    const startAlpha = alphaScale;
    const step = () => {
      if (disposed) return;
      const t = Math.min(1, (performance.now() - t0) / Math.max(1, durationMs));
      alphaScale = startAlpha * (1 - t);
      applyAlphaScale();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        dispose();
      }
    };
    requestAnimationFrame(step);
  }

  return { dispose, fadeOutAndDispose };
}
