/**
 * Rayon d'affichage des corps : on conserve les **proportions réelles** entre
 * Lune, planètes et Soleil (rayons IAU en km), avec un facteur d'exagération
 * commun à tous pour rester visible aux distances comprimées du rendu.
 *
 * Bornes :
 *  - plancher : pickability WebGL pour les corps les plus distants (Pluton).
 *  - plafond : la sphère ne peut pas dépasser une fraction de la distance, sinon
 *    la Lune (à distance réelle) engloutirait la Terre. Calé pour que la Lune
 *    apparaisse plus petite que la Terre (≈0.7 R⊕) et que le Soleil n'éclipse
 *    pas le globe non plus.
 *
 * L'exagération est exposée pour que la légende puisse l'afficher : le rendu
 * triche sur l'échelle absolue mais pas sur les rapports de tailles entre corps
 * (sauf au plafond, qui ne touche en pratique que Lune et Soleil).
 */
import { realRadiusKm, type CelestialBodyKind } from './bodyRadii';

/** Multiplicateur appliqué aux rayons réels pour rester visible à l'écran. */
const BODY_SIZE_EXAGGERATION = 100;

const MIN_RADIUS_M = 8e5;

// Cap = fraction de la distance géocentrique. Différencié pour préserver la
// hiérarchie perceptive : Lune/Soleil = disques bien lisibles ; planètes =
// petits points clairement plus petits que la Lune. Sinon le cap uniforme
// fait que tout (Lune, Jupiter, Saturne…) finit à la même taille angulaire.
const MAX_FRACTION_LUMINARY = 0.012; // moon · sun
const MAX_FRACTION_PLANET   = 0.003; // ~4× plus serré → Jupiter ≈ 1/3 Lune

function maxFractionOfDistance(kind: CelestialBodyKind): number {
  return kind === 'moon' || kind === 'sun'
    ? MAX_FRACTION_LUMINARY
    : MAX_FRACTION_PLANET;
}

/**
 * @param kind                          identité du corps (proportions réelles)
 * @param distanceFromEarthCenterM      norme du vecteur géocentrique (m)
 */
export function visualEllipsoidRadiusMeters(
  kind: CelestialBodyKind,
  distanceFromEarthCenterM: number,
): number {
  const realM = realRadiusKm(kind) * 1000;
  const exaggerated = realM * BODY_SIZE_EXAGGERATION;

  if (!Number.isFinite(distanceFromEarthCenterM) || distanceFromEarthCenterM <= 0) {
    return Math.max(exaggerated, MIN_RADIUS_M);
  }

  const cap = distanceFromEarthCenterM * maxFractionOfDistance(kind);
  return Math.min(Math.max(exaggerated, MIN_RADIUS_M), cap);
}
