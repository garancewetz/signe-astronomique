import { useMemo, type ReactNode } from 'react';
import {
  CockpitDisplayCtx,
  type CockpitDisplayValue,
} from './cockpitDisplayContextInternal';

interface ProviderProps extends CockpitDisplayValue {
  children: ReactNode;
}

/**
 * Single source of truth for the display-layer toggles consumed across the
 * sidebar, legend panel, mobile sheet, and mobile system drawer. Cockpit
 * owns the underlying state and wraps the tree in this provider so the
 * intermediate components don't have to thread a dozen props each.
 */
export function CockpitDisplayProvider({ children, ...value }: ProviderProps) {
  // Memoise so children with `React.memo` aren't re-rendered on every
  // Cockpit render — the value object identity stays stable across renders
  // that don't change any of the fields.
  const memoised = useMemo<CockpitDisplayValue>(
    () => value,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      value.bodyLabelsEnabled,
      value.guidesEnabled,
      value.satellitesEnabled,
      value.constellationOverlayEnabled,
      value.orbitalAvailable,
      value.orbitalStatus,
      value.sideViewActive,
      value.hasSelectedStar,
      value.toggleBodyLabels,
      value.toggleGuides,
      value.toggleSatellites,
      value.toggleConstellationOverlay,
      value.toggleSideView,
    ],
  );
  return (
    <CockpitDisplayCtx.Provider value={memoised}>
      {children}
    </CockpitDisplayCtx.Provider>
  );
}
