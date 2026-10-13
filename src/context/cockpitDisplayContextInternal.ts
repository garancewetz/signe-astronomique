import { createContext } from 'react';
export interface CockpitDisplayValue {
  bodyLabelsEnabled: boolean;
  toggleBodyLabels: () => void;
  guidesEnabled: boolean;
  toggleGuides: () => void;
  satellitesEnabled: boolean;
  toggleSatellites: () => void;

  sideViewActive: boolean;
  toggleSideView: () => void;
  hasSelectedStar: boolean;
}

export const CockpitDisplayCtx = createContext<CockpitDisplayValue | null>(null);
