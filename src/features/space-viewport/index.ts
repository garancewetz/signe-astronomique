// Public API for the space-viewport feature: Cesium scene, layer mounters,
// camera director, body picker, and the satellite relics data.
//
// The Cesium dependency must stay walled off: no `import 'cesium'` is
// allowed outside this folder. Sibling features interact with the scene
// only through the imperative `SpaceViewHandle` exposed via ref.

export {
  SpaceView,
  type SpaceViewHandle,
  type SelectedBody,
  type SelectedStar,
  type SelectedSun,
  type SelectedPlanet,
  type SelectedMoon,
  type SelectedSatellite,
} from './SpaceView';

export {
  useSatelliteTracker,
  type ParsedRelic,
  type SatelliteTrackerResult,
} from './useSatelliteTracker';

export {
  useRevealSequence,
  type RevealSequence,
} from './useRevealSequence';

export {
  SATELLITE_RELICS,
  SPACE_AGE_START_YEAR,
  isSilentEra,
  relicsAvailableOn,
  satelliteBlurb,
  satelliteName,
  type SatelliteRelic,
} from './data/satellitesDB';
