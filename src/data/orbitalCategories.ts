import type { OrbitalCategory } from '../hooks/useOrbitalPopulation';

/**
 * Single source of truth for the orbital overlay palette.
 *
 * Both the Cesium rendering layer (mountOrbitalLayer) and the HUD legend
 * (LegendDock) read from here so the colors shown next to each label
 * always match what's drawn in the scene.
 *
 * Pure data (no Cesium imports) so it can be consumed from non-space code.
 */
export interface OrbitalCategoryStyle {
  /** Hex color used for both the Cesium point and the legend dot. */
  hex: string;
  /** Cesium point alpha (0–1). Dim values keep the mesh from drowning stars. */
  alpha: number;
  /** Cesium pixelSize. Slightly bumped for navigation/weather (rarer, denser meaning). */
  pixelSize: number;
  /** User-facing French label shown in the legend. */
  label: string;
}

export const ORBITAL_CATEGORIES: Record<OrbitalCategory, OrbitalCategoryStyle> = {
  starlink: { hex: '#22d3ee', alpha: 0.28, pixelSize: 1.5, label: 'Starlink / comms LEO' },
  weather:  { hex: '#fbbf24', alpha: 0.55, pixelSize: 2.5, label: 'Météo / sciences' },
  nav:      { hex: '#f59e0b', alpha: 0.60, pixelSize: 2.8, label: 'Navigation (GPS…)' },
  comm:     { hex: '#818cf8', alpha: 0.45, pixelSize: 2.2, label: 'Communications GEO' },
  other:    { hex: '#94a3b8', alpha: 0.35, pixelSize: 1.8, label: 'Autres actifs' },
};
