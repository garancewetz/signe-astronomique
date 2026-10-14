// Public API for the astronomy feature.
// Framework-agnostic: no React, no DOM, no Cesium imports may appear here
// or anywhere in this folder.

export {
  toJulianDay,
  getIauBoundaries,
  precessionOffset,
  zodiacDriftDegrees,
  computeReading,
  sunSigns,
  formatRA,
  PLANETS_META,
  type CelestialBody,
  type CelestialReading,
  type IauConstellation,
  type MoonPhaseKey,
} from './astroEngine';

export {
  planetGeocentric,
  type PlanetId,
} from './planetEngine';

export {
  gmstRadians,
  raDecToEcefXYZ,
  raHoursToDegrees,
  starShellRadiusM,
  starShellRadiusMExpanded,
  AU_KM,
  CELESTIAL_SPHERE_KM,
} from './skyCoordinates';

export {
  CONSTELLATION_CATALOG,
  findConstellation,
  isZodiacal,
  abbrToZodiacal,
  type CatalogStar,
  type CatalogConstellation,
} from './data/constellationCatalog';

export {
  CONSTELLATION_LORE,
  loreName,
  loreShortName,
  lorePoetic,
} from './constellationLore';

export {
  EARTH_RADIUS_M,
  formatDistanceKmOrAU,
} from './formatDistance';
