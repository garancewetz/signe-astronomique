import { createContext } from 'react';
export interface CockpitDisplayValue {
  bodyLabelsEnabled: boolean;
  toggleBodyLabels: () => void;
  guidesEnabled: boolean;
  toggleGuides: () => void;
  /** Official IAU areas of the 13 signs along the Sun's path (natal mode). */
  zonesEnabled: boolean;
  toggleZones: () => void;
  satellitesEnabled: boolean;
  toggleSatellites: () => void;

  sideViewActive: boolean;
  toggleSideView: () => void;
  hasSelectedStar: boolean;
}

export const CockpitDisplayCtx = createContext<CockpitDisplayValue | null>(null);
