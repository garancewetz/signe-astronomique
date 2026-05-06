/**
 * Astrolabe - Astro Engine
 *
 * Algorithmes de Jean Meeus (Astronomical Algorithms, 2e éd.).
 * Précision visée :
 *   - Longitude écliptique du Soleil : ~0.01° sur 1900-2100
 *   - Lune : ~10' en longitude, ~3' en latitude
 *   - Planètes : ~0.1° (telluriques) à ~1° (géantes), via planetEngine.ts
 *   - Sidereal time : ~0.1s
 *   - Ascendant : ~1' (limité par l'arrondi de la latitude utilisateur)
 *
 * Ce moteur opère ENTIÈREMENT en référentiel UTC. Les fuseaux horaires
 * doivent être convertis en amont par l'appelant.
 */

import { planetGeocentric, PLANETS_META, type PlanetId } from './planetEngine';
export type { PlanetId } from './planetEngine';
export { PLANETS_META } from './planetEngine';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ─── Types ───────────────────────────────────────────────────────────────────

interface BirthInput {
  /** Date/heure UTC de naissance */
  date: Date;
  /** Latitude en degrés, Nord positif */
  latitude: number;
  /** Longitude en degrés, Est positif */
  longitude: number;
  /** Lieu (label affichable, optionnel) */
  placeLabel?: string;
}

/**
 * Représentation unifiée d'un astre (Soleil, Lune, planète) pour le rendu
 * et le rapport. Toutes les coordonnées sont apparentes, géocentriques.
 */
export interface CelestialBody {
  id: 'sun' | 'moon' | PlanetId;
  /** Nom français */
  name: string;
  /** Glyphe astronomique unicode */
  glyph: string;
  /** Couleur de marqueur (hex) */
  color: string;
  /** Longitude écliptique tropicale, degrés [0..360) */
  eclipticLongitude: number;
  /** Latitude écliptique, degrés */
  eclipticLatitude: number;
  /** Ascension droite, heures [0..24) */
  ra: number;
  /** Déclinaison, degrés */
  dec: number;
  /** Constellation IAU traversée (frame ICRS) */
  constellation: IauConstellation;
  /** Distance à la Terre — AU pour planètes, sans unité pour Soleil/Lune */
  distance?: number;
}

interface MoonReading {
  /** Longitude écliptique géocentrique apparente, degrés [0..360) */
  eclipticLongitude: number;
  /** Latitude écliptique géocentrique, degrés */
  eclipticLatitude: number;
  /** Ascension droite, heures [0..24) */
  ra: number;
  /** Déclinaison, degrés */
  dec: number;
  /** Élongation Soleil-Lune, degrés [0..360) */
  elongation: number;
  /** Fraction illuminée [0..1] */
  illumination: number;
  /** Phase littérale */
  phaseName: 'Nouvelle' | 'Premier croissant' | 'Premier quartier' | 'Gibbeuse croissante'
            | 'Pleine' | 'Gibbeuse décroissante' | 'Dernier quartier' | 'Dernier croissant';
  /** Constellation IAU dans laquelle se trouve la Lune */
  constellation: IauConstellation;
  /** Distance Terre-Lune (km) — varie de ~363 000 (périgée) à ~405 000 (apogée) */
  distanceKm: number;
}

export interface CelestialReading {
  julianDay: number;
  /** Longitude écliptique tropicale (référentiel équinoxe de la date), degrés [0..360) */
  sunEclipticLongitude: number;
  /** Longitude écliptique sidérale (frame IAU/ICRS), degrés [0..360) */
  sunSiderealLongitude: number;
  /** Ascension droite du Soleil, heures [0..24) */
  sunRA: number;
  /** Déclinaison du Soleil, degrés */
  sunDec: number;
  /** Obliquité apparente de l'écliptique, degrés */
  obliquity: number;
  /** Temps sidéral apparent à Greenwich, heures [0..24) */
  greenwichSiderealTime: number;
  /** Temps sidéral local, heures [0..24) */
  localSiderealTime: number;
  /** Ascendant : longitude écliptique de l'horizon Est, degrés [0..360) */
  ascendantLongitude: number;
  /** Constellation IAU traversée par le Soleil au moment de la naissance */
  trueConstellation: IauConstellation;
  /** Signe astrologique tropical "classique" (mapping naïf 30°/signe) */
  tropicalSign: ZodiacSign;
  /** Décalage tropical / sidéral en jours (≈ 24-25 jours en 2026) */
  precessionGapDays: number;
  /** Nombre de jours que le Soleil passe réellement dans cette constellation */
  daysInConstellation: number;
  /** Position et phase de la Lune */
  moon: MoonReading;
  /** Constellation où se lève l'horizon Est (Ascendant) */
  ascendantConstellation: IauConstellation;
  /** Tous les corps célestes (Soleil, Lune, 8 planètes + Pluton) */
  bodies: CelestialBody[];
  /** Input d'origine, repassé pour affichage */
  input: BirthInput;
}

type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type IauConstellation = ZodiacSign | 'Ophiuchus';

// ─── Helpers numériques ──────────────────────────────────────────────────────

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const norm24  = (x: number) => ((x % 24) + 24) % 24;

// ─── Conversion calendrier → Jour Julien (Meeus 7.1) ─────────────────────────

/**
 * Jour julien à partir d'une Date JS (interprétée en UTC).
 *
 * ⚠ Rappel pour l'appelant : `new Date(YYYY, M, D)` interprète M en base 0
 * (janvier = 0, février = 1...). Pour le 18 janvier 1992, utiliser
 * `new Date(Date.UTC(1992, 0, 18))` — pas `new Date(1992, 1, 18)`,
 * qui donnerait le 18 février. Ici, `getUTCMonth()` renvoie 0..11 et l'on
 * ajoute 1 pour obtenir le mois calendaire 1..12 utilisé par Meeus.
 */
export function toJulianDay(date: Date): number {
  let Y = date.getUTCFullYear();
  let M = date.getUTCMonth() + 1;
  const D =
    date.getUTCDate() +
    (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;

  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4); // calendrier grégorien

  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    D + B - 1524.5
  );
}

// ─── Soleil : longitude écliptique apparente (Meeus ch. 25) ─────────────────

interface SunSolution { lambda: number; obliquity: number; }

function sunApparentLongitude(jd: number): SunSolution {
  const T = (jd - 2451545.0) / 36525;

  // Longitude moyenne géométrique
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  // Anomalie moyenne
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mr = M * DEG;

  // Équation du centre
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);

  const trueLong = L0 + C;

  // Correction nutation + aberration (Meeus 25.8 simplifiée)
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG);

  // Obliquité moyenne (Meeus 22.2) + correction de nutation
  const eps0 =
    23 + 26 / 60 + 21.448 / 3600 -
    (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
  const eps = eps0 + 0.00256 * Math.cos(omega * DEG);

  return { lambda: norm360(lambda), obliquity: eps };
}

// ─── Lune : position géocentrique apparente (Meeus ch. 47, simplifié) ──────
// Précision : ~10' en longitude, ~3' en latitude — largement suffisant pour
// la visualisation et la détermination de la phase.

interface MoonSolution {
  lon: number;        // longitude écliptique géocentrique (deg)
  lat: number;        // latitude écliptique géocentrique  (deg)
  distanceKm: number; // distance Terre-Lune (km)
}

function moonApparentPosition(jd: number): MoonSolution {
  const T = (jd - 2451545.0) / 36525;

  // Arguments fondamentaux (Meeus 47.1-47.5)
  const Lp = norm360(218.3164591 + 481267.88134236 * T - 0.0013268 * T * T);  // longitude moyenne
  const D  = norm360(297.8502042 + 445267.1115168  * T - 0.00163   * T * T);  // élongation moyenne
  const M  = norm360(357.5291092 + 35999.0502909   * T - 0.0001536 * T * T);  // anomalie moyenne du Soleil
  const Mp = norm360(134.9634114 + 477198.8676313  * T + 0.0089970 * T * T);  // anomalie moyenne de la Lune
  const F  = norm360( 93.2720993 + 483202.0175273  * T - 0.0034029 * T * T);  // argument de latitude

  const sind = (x: number) => Math.sin(x * DEG);
  const cosd = (x: number) => Math.cos(x * DEG);

  // Termes périodiques dominants pour la longitude (Meeus table 47.A, top 10)
  const dLon =
      6.288774 * sind(Mp)
    + 1.274027 * sind(2 * D - Mp)
    + 0.658314 * sind(2 * D)
    + 0.213618 * sind(2 * Mp)
    - 0.185116 * sind(M)
    - 0.114332 * sind(2 * F)
    + 0.058793 * sind(2 * D - 2 * Mp)
    + 0.057066 * sind(2 * D - M - Mp)
    + 0.053322 * sind(2 * D + Mp)
    + 0.045758 * sind(2 * D - M)
    - 0.040923 * sind(M - Mp)
    - 0.034720 * sind(D)
    - 0.030383 * sind(M + Mp);

  // Termes périodiques dominants pour la latitude (Meeus table 47.B)
  const dLat =
      5.128122 * sind(F)
    + 0.280602 * sind(Mp + F)
    + 0.277693 * sind(Mp - F)
    + 0.173237 * sind(2 * D - F)
    + 0.055413 * sind(2 * D - Mp + F)
    + 0.046271 * sind(2 * D - Mp - F)
    + 0.032573 * sind(2 * D + F)
    + 0.017198 * sind(2 * Mp + F)
    - 0.009445 * sind(2 * D + Mp - F);

  // Termes dominants pour la distance, en km (Meeus table 47.A, colonne B).
  // Précision résiduelle ~100 km, suffisante pour le rendu (apogée 405k,
  // périgée 363k → la modulation orbitale reste lisible).
  const distanceKm =
      385000.56
    - 20905.355 * cosd(Mp)
    -  3699.111 * cosd(2 * D - Mp)
    -  2955.968 * cosd(2 * D)
    -   569.925 * cosd(2 * Mp)
    +    48.888 * cosd(M)
    -     3.149 * cosd(2 * F)
    +   246.158 * cosd(2 * D - 2 * Mp)
    -   152.138 * cosd(2 * D - M - Mp)
    -   170.733 * cosd(2 * D + Mp)
    -   204.586 * cosd(2 * D - M)
    -   129.620 * cosd(D)
    +   108.743 * cosd(M - Mp)
    +   104.755 * cosd(M + Mp);

  return {
    lon: norm360(Lp + dLon),
    lat: dLat,
    distanceKm,
  };
}

// ─── Temps sidéral apparent à Greenwich (Meeus 12.4) ────────────────────────

function greenwichSiderealTime(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const theta =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return norm24(norm360(theta) / 15);
}

// ─── Ascendant : longitude écliptique de l'horizon Est (Meeus ch. 14) ───────

function ascendant(lstHours: number, latDeg: number, epsDeg: number): number {
  const lst = lstHours * 15 * DEG;
  const lat = latDeg * DEG;
  const eps = epsDeg * DEG;

  // Meeus formule 14.6 : tan(asc) = -cos(LST) / (sin(LST)·cos(eps) + tan(lat)·sin(eps))
  const y = -Math.cos(lst);
  const x = Math.sin(lst) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);
  const asc = Math.atan2(y, x) * RAD;

  // L'ascendant doit être dans le quadrant qui suit le MC (Médium Coeli).
  // La formule atan2 ci-dessus retourne dans [-180, 180] ; on normalise.
  return norm360(asc);
}

// ─── Limites IAU des 13 constellations zodiacales ───────────────────────────
// Longitudes écliptiques (frame ICRS) où le Soleil ENTRE dans chaque
// constellation — d'après les frontières IAU 1930 (E. Delporte).
// Chaque ligne dit : « à partir de cette longitude, le Soleil est dans cette
// constellation (et y restera jusqu'à la longitude de la ligne suivante) ».
// La date donnée est la date de transit du Soleil à cette longitude, à l'époque
// actuelle ; après précession (~50.29″/an) elle dérive lentement.

const IAU_BOUNDARIES: Array<{
  start: number;
  constellation: IauConstellation;
  approximateEntryDate: string;
  durationDays: number;
}> = [
  { start:  29.08, constellation: 'Aries',       approximateEntryDate: '19 avril',    durationDays: 25 },
  { start:  53.46, constellation: 'Taurus',      approximateEntryDate: '14 mai',      durationDays: 37 },
  { start:  90.42, constellation: 'Gemini',      approximateEntryDate: '21 juin',     durationDays: 31 },
  { start: 118.27, constellation: 'Cancer',      approximateEntryDate: '21 juillet',  durationDays: 20 },
  { start: 138.18, constellation: 'Leo',         approximateEntryDate: '10 août',     durationDays: 37 },
  { start: 174.15, constellation: 'Virgo',       approximateEntryDate: '16 septembre',durationDays: 45 },
  { start: 218.06, constellation: 'Libra',       approximateEntryDate: '31 octobre',  durationDays: 23 },
  { start: 241.05, constellation: 'Scorpio',     approximateEntryDate: '23 novembre', durationDays:  6 },
  { start: 247.75, constellation: 'Ophiuchus',   approximateEntryDate: '29 novembre', durationDays: 19 }, // ★ le 13e
  { start: 266.60, constellation: 'Sagittarius', approximateEntryDate: '18 décembre', durationDays: 32 },
  { start: 299.71, constellation: 'Capricorn',   approximateEntryDate: '20 janvier',  durationDays: 27 },
  { start: 327.86, constellation: 'Aquarius',    approximateEntryDate: '16 février',  durationDays: 24 },
  { start: 351.61, constellation: 'Pisces',      approximateEntryDate: '12 mars',     durationDays: 38 },
];

export function getIauBoundaries() {
  return IAU_BOUNDARIES;
}

/** Mappe une longitude écliptique sidérale [0..360) vers une constellation IAU. */
function constellationFromSiderealLongitude(lon: number): IauConstellation {
  const x = norm360(lon);
  let result: IauConstellation = 'Pisces'; // wrap : avant 29.08° on est encore en Pisces
  for (const b of IAU_BOUNDARIES) {
    if (x >= b.start) result = b.constellation;
  }
  return result;
}

/** Renvoie la durée en jours que le Soleil passe dans cette constellation. */
function daysInConstellation(c: IauConstellation): number {
  return IAU_BOUNDARIES.find(b => b.constellation === c)?.durationDays ?? 30;
}

// ─── Astrologie tropicale (référence pour comparaison) ──────────────────────

const TROPICAL_SIGNS: ZodiacSign[] = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

function tropicalSignFromLongitude(lon: number): ZodiacSign {
  return TROPICAL_SIGNS[Math.floor(norm360(lon) / 30)];
}

/**
 * Précession des équinoxes : ~50.29″/an depuis J2000.
 * Convertit une longitude tropicale en longitude sidérale (frame IAU).
 */
export function precessionOffset(jd: number): number {
  const yearsSinceJ2000 = (jd - 2451545.0) / 365.25;
  return (50.29 / 3600) * yearsSinceJ2000;
}

// ─── Conversion écliptique → équatoriale (Meeus 13.3) ───────────────────────

interface Equatorial { ra: number; dec: number; }

function eclipticToEquatorial(lonDeg: number, latDeg: number, epsDeg: number): Equatorial {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const eps = epsDeg * DEG;
  const sinDec = Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * Math.sin(lon);
  const dec = Math.asin(sinDec);
  const y = Math.sin(lon) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps);
  const x = Math.cos(lon);
  const ra = Math.atan2(y, x);
  return {
    ra: norm24((ra * RAD) / 15),
    dec: dec * RAD,
  };
}

// ─── Phase de la Lune ───────────────────────────────────────────────────────

function phaseName(elongation: number): MoonReading['phaseName'] {
  const e = norm360(elongation);
  if (e < 22.5 || e >= 337.5) return 'Nouvelle';
  if (e < 67.5)                return 'Premier croissant';
  if (e < 112.5)               return 'Premier quartier';
  if (e < 157.5)               return 'Gibbeuse croissante';
  if (e < 202.5)               return 'Pleine';
  if (e < 247.5)               return 'Gibbeuse décroissante';
  if (e < 292.5)               return 'Dernier quartier';
  return 'Dernier croissant';
}

/** Convertit une longitude tropicale en constellation IAU. */
function eclipticToConstellation(lonTropical: number, jd: number): IauConstellation {
  const offset = precessionOffset(jd);
  return constellationFromSiderealLongitude(norm360(lonTropical - offset));
}

// ─── Point d'entrée principal ────────────────────────────────────────────────

export function computeReading(input: BirthInput): CelestialReading {
  const jd = toJulianDay(input.date);
  const { lambda: sunTropical, obliquity: eps } = sunApparentLongitude(jd);

  // Position équatoriale du Soleil
  const sunEq = eclipticToEquatorial(sunTropical, 0, eps);

  const gst = greenwichSiderealTime(jd);
  const lst = norm24(gst + input.longitude / 15);
  const asc = ascendant(lst, input.latitude, eps);

  // Précession & constellation traversée par le Soleil
  const offset = precessionOffset(jd);
  const sunSidereal = norm360(sunTropical - offset);
  const trueConstellation = constellationFromSiderealLongitude(sunSidereal);

  if (typeof console !== 'undefined' && console.debug) {
    console.debug(
      '[astroEngine] date=%s UTC | JD=%s | L_tropical=%s° | L_sidereal=%s° | constellation=%s | tropicalSign=%s',
      input.date.toISOString(),
      jd.toFixed(4),
      sunTropical.toFixed(3),
      sunSidereal.toFixed(3),
      trueConstellation,
      tropicalSignFromLongitude(sunTropical),
    );
  }

  // Lune
  const moon = moonApparentPosition(jd);
  const moonEq = eclipticToEquatorial(moon.lon, moon.lat, eps);
  const elongation = norm360(moon.lon - sunTropical);
  const illumination = (1 - Math.cos(elongation * DEG)) / 2;

  // Construction du tableau unifié de corps célestes
  const bodies: CelestialBody[] = [
    {
      id: 'sun',
      name: 'Soleil',
      glyph: '☉',
      color: '#fde68a',
      eclipticLongitude: sunTropical,
      eclipticLatitude: 0,
      ra: sunEq.ra,
      dec: sunEq.dec,
      constellation: trueConstellation,
    },
    {
      id: 'moon',
      name: 'Lune',
      glyph: '☽',
      color: '#e2e8f0',
      eclipticLongitude: moon.lon,
      eclipticLatitude: moon.lat,
      ra: moonEq.ra,
      dec: moonEq.dec,
      constellation: eclipticToConstellation(moon.lon, jd),
    },
  ];

  // Planètes
  (Object.keys(PLANETS_META) as PlanetId[]).forEach(id => {
    const meta = PLANETS_META[id];
    const pos = planetGeocentric(id, jd);
    const eq = eclipticToEquatorial(pos.lon, pos.lat, eps);
    bodies.push({
      id,
      name: meta.fr,
      glyph: meta.glyph,
      color: meta.color,
      eclipticLongitude: pos.lon,
      eclipticLatitude: pos.lat,
      ra: eq.ra,
      dec: eq.dec,
      constellation: eclipticToConstellation(pos.lon, jd),
      distance: pos.distance,
    });
  });

  return {
    julianDay: jd,
    sunEclipticLongitude: sunTropical,
    sunSiderealLongitude: sunSidereal,
    sunRA: sunEq.ra,
    sunDec: sunEq.dec,
    obliquity: eps,
    greenwichSiderealTime: gst,
    localSiderealTime: lst,
    ascendantLongitude: asc,
    trueConstellation,
    tropicalSign: tropicalSignFromLongitude(sunTropical),
    precessionGapDays: offset / (360 / 365.25),
    daysInConstellation: daysInConstellation(trueConstellation),
    moon: {
      eclipticLongitude: moon.lon,
      eclipticLatitude: moon.lat,
      ra: moonEq.ra,
      dec: moonEq.dec,
      elongation,
      illumination,
      phaseName: phaseName(elongation),
      constellation: eclipticToConstellation(moon.lon, jd),
      distanceKm: moon.distanceKm,
    },
    ascendantConstellation: eclipticToConstellation(asc, jd),
    bodies,
    input,
  };
}

// ─── Formatage pour affichage HUD ────────────────────────────────────────────

export function formatRA(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.round(((hours - h) * 60 - m) * 60);
  return `${h.toString().padStart(2,'0')}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
}
