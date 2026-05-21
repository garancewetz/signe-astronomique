import { createContext } from 'react';
import type { OrbitalStatus } from '@/features/space-viewport';

export interface CockpitDisplayValue {
  bodyLabelsEnabled: boolean;
  toggleBodyLabels: () => void;
  guidesEnabled: boolean;
  toggleGuides: () => void;
  satellitesEnabled: boolean;
  toggleSatellites: () => void;

  constellationOverlayEnabled: boolean;
  /**
   * Composed handler — retries on error before toggling, so the layer chip
   * can be pressed to recover from a Celestrak fetch failure.
   */
  toggleConstellationOverlay: () => void;
  orbitalAvailable: boolean;
  orbitalStatus: OrbitalStatus;

  sideViewActive: boolean;
  toggleSideView: () => void;
  hasSelectedStar: boolean;
}

export const CockpitDisplayCtx = createContext<CockpitDisplayValue | null>(null);
