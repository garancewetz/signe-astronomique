/**
 * Astrolabe · Planet Engine
 *
 * Apparent geocentric positions of the 8 planets + Pluto, derived from the
 * JPL mean orbital elements ("Approximate Positions of the Planets" table,
 * valid 1800-2050).
 *
 * Typical accuracy: ~0.1° for the inner planets, ~1° for the gas giants —
 * sufficient to identify the constellation the body is crossing.
 *
 * Reference: Standish & Williams (NASA JPL Solar System Dynamics).
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const norm360 = (x: number) => ((x % 360) + 360) % 360;

// ─── Identity ───────────────────────────────────────────────────────────────

export type PlanetId =
  | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'
  | 'uranus'  | 'neptune' | 'pluto';

interface PlanetMeta {
  id: PlanetId;
  /** French name. */
  fr: string;
  /** English name. */
  en: string;
  /** Marker color (hex). */
  color: string;
  /** Unicode astronomical glyph. */
  glyph: string;
}

export const PLANETS_META: Record<PlanetId, PlanetMeta> = {
  mercury: { id: 'mercury', fr: 'Mercure', en: 'Mercury', color: '#a3a3a3', glyph: '☿' },
  venus:   { id: 'venus',   fr: 'Vénus',   en: 'Venus',   color: '#fde68a', glyph: '♀' },
  mars:    { id: 'mars',    fr: 'Mars',    en: 'Mars',    color: '#fb7185', glyph: '♂' },
  jupiter: { id: 'jupiter', fr: 'Jupiter', en: 'Jupiter', color: '#fdba74', glyph: '♃' },
  saturn:  { id: 'saturn',  fr: 'Saturne', en: 'Saturn',  color: '#facc15', glyph: '♄' },
  uranus:  { id: 'uranus',  fr: 'Uranus',  en: 'Uranus',  color: '#7dd3fc', glyph: '♅' },
  neptune: { id: 'neptune', fr: 'Neptune', en: 'Neptune', color: '#60a5fa', glyph: '♆' },
  pluto:   { id: 'pluto',   fr: 'Pluton',  en: 'Pluto',   color: '#a78bfa', glyph: '♇' },
};

// ─── JPL orbital elements (1800-2050) ───────────────────────────────────────
// Format: value at J2000 + drift per Julian century.
// Units: AU (a), unitless (e), degrees (i, L, ϖ, Ω).

interface OrbitalElements {
  a:  [number, number]; // semi-major axis (AU)
  e:  [number, number]; // eccentricity
  i:  [number, number]; // inclination
  L:  [number, number]; // mean longitude
  pi: [number, number]; // longitude of perihelion ϖ
  Om: [number, number]; // longitude of the ascending node Ω
}

const ELEMENTS: Record<PlanetId | 'earth', OrbitalElements> = {
  mercury: {
    a:  [ 0.38709927,  0.00000037],
    e:  [ 0.20563593,  0.00001906],
    i:  [ 7.00497902, -0.00594749],
    L:  [252.25032350, 149472.67411175],
    pi: [ 77.45779628,  0.16047689],
    Om: [ 48.33076593, -0.12534081],
  },
  venus: {
    a:  [ 0.72333566,  0.00000390],
    e:  [ 0.00677672, -0.00004107],
    i:  [ 3.39467605, -0.00078890],
    L:  [181.97909950, 58517.81538729],
    pi: [131.60246718,  0.00268329],
    Om: [ 76.67984255, -0.27769418],
  },
  earth: {
    a:  [ 1.00000261,  0.00000562],
    e:  [ 0.01671123, -0.00004392],
    i:  [-0.00001531, -0.01294668],
    L:  [100.46457166, 35999.37244981],
    pi: [102.93768193,  0.32327364],
    Om: [  0.0,         0.0],
  },
  mars: {
    a:  [ 1.52371034,  0.00001847],
    e:  [ 0.09339410,  0.00007882],
    i:  [ 1.84969142, -0.00813131],
    L:  [ -4.55343205, 19140.30268499],
    pi: [-23.94362959,  0.44441088],
    Om: [ 49.55953891, -0.29257343],
  },
  jupiter: {
    a:  [ 5.20288700, -0.00011607],
    e:  [ 0.04838624, -0.00013253],
    i:  [ 1.30439695, -0.00183714],
    L:  [ 34.39644051,  3034.74612775],
    pi: [ 14.72847983,  0.21252668],
    Om: [100.47390909,  0.20469106],
  },
  saturn: {
    a:  [ 9.53667594, -0.00125060],
    e:  [ 0.05386179, -0.00050991],
    i:  [ 2.48599187,  0.00193609],
    L:  [ 49.95424423,  1222.49362201],
    pi: [ 92.59887831, -0.41897216],
    Om: [113.66242448, -0.28867794],
  },
  uranus: {
    a:  [19.18916464, -0.00196176],
    e:  [ 0.04725744, -0.00004397],
    i:  [ 0.77263783, -0.00242939],
    L:  [313.23810451,   428.48202785],
    pi: [170.95427630,  0.40805281],
    Om: [ 74.01692503,  0.04240589],
  },
  neptune: {
    a:  [30.06992276,  0.00026291],
    e:  [ 0.00859048,  0.00005105],
    i:  [ 1.77004347,  0.00035372],
    L:  [-55.12002969,   218.45945325],
    pi: [ 44.96476227, -0.32241464],
    Om: [131.78422574, -0.00508664],
  },
  pluto: {
    a:  [39.48211675, -0.00031596],
    e:  [ 0.24882730,  0.00005170],
    i:  [17.14001206,  0.00004818],
    L:  [238.92903833,   145.20780515],
    pi: [224.06891629, -0.04062942],
    Om: [110.30393684, -0.01183482],
  },
};

// ─── Kepler solver ──────────────────────────────────────────────────────────

function solveKepler(M: number, e: number): number {
  // M in radians.
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

// ─── Heliocentric ecliptic position (J2000) ─────────────────────────────────

interface Vec3 { x: number; y: number; z: number; }

function heliocentricEcliptic(body: PlanetId | 'earth', T: number): Vec3 {
  const el = ELEMENTS[body];
  const a  = el.a[0]  + el.a[1]  * T;
  const e  = el.e[0]  + el.e[1]  * T;
  const i  = (el.i[0]  + el.i[1]  * T) * DEG;
  const L  = (el.L[0]  + el.L[1]  * T) * DEG;
  const pi = (el.pi[0] + el.pi[1] * T) * DEG;
  const Om = (el.Om[0] + el.Om[1] * T) * DEG;

  const omega = pi - Om;        // argument of perihelion
  const M = L - pi;             // mean anomaly
  const Mn = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const E = solveKepler(Mn, e);

  // Coordinates in the orbital plane.
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotation by ω, then i, then Ω.
  const co = Math.cos(omega), so = Math.sin(omega);
  const ci = Math.cos(i),     si = Math.sin(i);
  const cO = Math.cos(Om),    sO = Math.sin(Om);

  // JPL method: composed rotation matrix.
  const x =
      (co * cO - so * sO * ci) * xp +
    (-so * cO - co * sO * ci) * yp;
  const y =
      (co * sO + so * cO * ci) * xp +
    (-so * sO + co * cO * ci) * yp;
  const z = (so * si) * xp + (co * si) * yp;

  return { x, y, z };
}

// ─── Public API ─────────────────────────────────────────────────────────────

interface GeocentricPosition {
  /** Geocentric ecliptic longitude (deg, [0..360)). */
  lon: number;
  /** Geocentric ecliptic latitude (deg). */
  lat: number;
  /** Earth → body distance in AU. */
  distance: number;
}

/**
 * Apparent geocentric position of a planet at a given Julian day.
 */
export function planetGeocentric(body: PlanetId, jd: number): GeocentricPosition {
  const T = (jd - 2451545.0) / 36525;

  const planet = heliocentricEcliptic(body, T);
  const earth  = heliocentricEcliptic('earth', T);

  const dx = planet.x - earth.x;
  const dy = planet.y - earth.y;
  const dz = planet.z - earth.z;

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const lon = norm360(Math.atan2(dy, dx) * RAD);
  const lat = Math.atan2(dz, Math.sqrt(dx * dx + dy * dy)) * RAD;

  return { lon, lat, distance };
}
