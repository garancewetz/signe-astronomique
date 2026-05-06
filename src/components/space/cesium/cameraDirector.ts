import {
  Cartesian3,
  EasingFunction,
  PerspectiveFrustum,
  type Viewer,
} from 'cesium';
import {
  raDecToEcef,
  raHoursToDegrees,
} from '../../../utils/skyCoordinates';

// 100 000 km — Terre fait ~7° apparent (taille d'une bille à bout de bras),
// même calibration que lumina-sky. Ça laisse de la place pour la Lune
// (à ~284 000 km de la caméra côté Terre) et la sphère céleste (200 000 km).
const ORBITAL_ALTITUDE_M = 100_000_000;

/**
 * Vue par défaut : orbite équatoriale à 30 000 km, regard nadir vers le
 * point (lat 0, lon 0). À cette altitude, la Terre occupe ~24° du champ et
 * la sphère céleste (200 000 km) reste largement au-delà — vrai sentiment
 * "cockpit en orbite".
 */
export function flyToOrbital(viewer: Viewer, duration = 1.5): void {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(0, 0, ORBITAL_ALTITUDE_M),
    orientation: {
      heading: 0,
      pitch: -Math.PI / 2,
      roll: 0,
    },
    duration,
    easingFunction: EasingFunction.QUADRATIC_IN_OUT,
  });
}

interface CelestialDirParams {
  /** RA en heures (convention astroEngine) */
  raHours: number;
  /** Dec en degrés */
  decDeg: number;
  /** GMST en radians à la date affichée */
  gmstRad: number;
  /** Durée d'animation (s). Défaut 2.6. */
  duration?: number;
}

/**
 * Cadre une direction céleste (RA/Dec) : la caméra se positionne en orbite
 * à l'opposé de cette direction et regarde vers la Terre — le corps visé
 * apparaît derrière la Terre, centré.
 *
 * Géométrie :
 *   dir      = direction unitaire Terre→corps (ECEF, GMST appliqué)
 *   camPos   = D · (−cos α · dir + sin α · perp)
 *   direction = −camPos / |camPos|       (caméra → centre Terre)
 *   up        = ẑ projeté ⊥ à direction
 *
 * α cale le corps à ~30% du demi-FOV vertical.
 */
export function flyToCelestialDirection(
  viewer: Viewer,
  p: CelestialDirParams,
): void {
  const { raHours, decDeg, gmstRad, duration = 2.6 } = p;
  const camera = viewer.camera;

  const dirEcef = raDecToEcef(raHoursToDegrees(raHours), decDeg, gmstRad, 1);
  const sunVec = new Cartesian3(dirEcef.x, dirEcef.y, dirEcef.z);

  // Distance caméra constante (orbite stable autour de la Terre).
  const D = ORBITAL_ALTITUDE_M;

  // Demi-FOV vertical réel pour calibrer alpha.
  // Le frustum Cesium peut être perspective ou orthographique ; on garde
  // un fallback à π/3 pour les cas non-perspective (jamais en SCENE3D natal).
  const frustum = camera.frustum;
  const fovHoriz =
    frustum instanceof PerspectiveFrustum && frustum.fov != null
      ? frustum.fov
      : Math.PI / 3;
  const aspect =
    viewer.scene.canvas.clientWidth / viewer.scene.canvas.clientHeight;
  const fovVert =
    aspect > 1
      ? 2 * Math.atan(Math.tan(fovHoriz / 2) / aspect)
      : fovHoriz;
  const ALPHA = fovVert * 0.3;

  // perp = pôle céleste Z projeté sur le plan ⊥ à sunVec, normalisé.
  const zAxis = new Cartesian3(0, 0, 1);
  const dotZ = Cartesian3.dot(zAxis, sunVec);
  const perp = Cartesian3.subtract(
    zAxis,
    Cartesian3.multiplyByScalar(sunVec, dotZ, new Cartesian3()),
    new Cartesian3(),
  );
  Cartesian3.normalize(perp, perp);

  const term1 = Cartesian3.multiplyByScalar(
    sunVec,
    -Math.cos(ALPHA) * D,
    new Cartesian3(),
  );
  const term2 = Cartesian3.multiplyByScalar(
    perp,
    Math.sin(ALPHA) * D,
    new Cartesian3(),
  );
  const camPos = Cartesian3.add(term1, term2, new Cartesian3());

  const direction = Cartesian3.normalize(
    Cartesian3.negate(camPos, new Cartesian3()),
    new Cartesian3(),
  );
  const upDot = Cartesian3.dot(zAxis, direction);
  const up = Cartesian3.subtract(
    zAxis,
    Cartesian3.multiplyByScalar(direction, upDot, new Cartesian3()),
    new Cartesian3(),
  );
  Cartesian3.normalize(up, up);

  viewer.camera.flyTo({
    destination: camPos,
    orientation: { direction, up },
    duration,
    easingFunction: EasingFunction.QUADRATIC_IN_OUT,
  });
}
