/**
 * Rayons équatoriaux moyens (km) — données IAU / NASA fact sheets.
 * Source : https://nssdc.gsfc.nasa.gov/planetary/factsheet/
 *
 * La Terre n'apparaît pas ici : c'est l'ellipsoïde WGS84 du globe Cesium
 * (R ≈ 6 378 km), qui sert de référence pour la perception des proportions.
 */
import type { PlanetId } from '../../../../utils/planetEngine';

const SUN_RADIUS_KM = 695_700;
const MOON_RADIUS_KM = 1_737.4;

const PLANET_RADII_KM: Record<PlanetId, number> = {
  mercury: 2_439.7,
  venus:   6_051.8,
  mars:    3_389.5,
  jupiter: 69_911,
  saturn:  58_232,
  uranus:  25_362,
  neptune: 24_622,
  pluto:   1_188.3,
};

export type CelestialBodyKind = 'moon' | 'sun' | PlanetId;

export function realRadiusKm(kind: CelestialBodyKind): number {
  if (kind === 'moon') return MOON_RADIUS_KM;
  if (kind === 'sun') return SUN_RADIUS_KM;
  return PLANET_RADII_KM[kind];
}
