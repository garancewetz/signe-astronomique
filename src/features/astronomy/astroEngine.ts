/**
 * Astrolabe - Astro Engine
 *
 * Algorithms from Jean Meeus (Astronomical Algorithms, 2nd ed.).
 * Target accuracy:
 *   - Sun ecliptic longitude: ~0.01° over 1900-2100
 *   - Moon: ~10' in longitude, ~3' in latitude
 *   - Planets: ~0.1° (terrestrial) to ~1° (gas giants), via planetEngine.ts
 *   - Sidereal time: ~0.1s
 *   - Ascendant: ~1' (capped by the rounding of the user-supplied latitude)
 *
 * This engine operates ENTIRELY in UTC. Local time zones must be converted
 * by the caller before invoking computeReading.
 */

import { planetGeocentric, PLANETS_META, type PlanetId } from './planetEngine';
export { PLANETS_META } from './planetEngine';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ─── Types ───────────────────────────────────────────────────────────────────

interface BirthInput {
  /** UTC birth date/time. */
  date: Date;
  /** Latitude in degrees, North positive. */
  latitude: number;
  /** Longitude in degrees, East positive. */
  longitude: number;
  /** Place (displayable label, optional). */
  placeLabel?: string;
  /** IANA time zone of the place (e.g. "America/New_York"). Used to format
   *  the display and the time of day in the local frame. */
  timezone?: string;
}

/**
 * Unified representation of a celestial body (Sun, Moon, planet) for the
 * scene and the report. All coordinates are apparent and geocentric.
 */
export interface CelestialBody {
  id: 'sun' | 'moon' | PlanetId;
  /** Display name (French). */
  name: string;
  /** Unicode astronomical glyph. */
  glyph: string;
  /** Marker color (hex). */
  color: string;
  /** Tropical ecliptic longitude, degrees [0..360). */
  eclipticLongitude: number;
  /** Ecliptic latitude, degrees. */
  eclipticLatitude: number;
  /** Right ascension, hours [0..24). */
  ra: number;
  /** Declination, degrees. */
  dec: number;
  /** IAU constellation the body is crossing (ICRS frame). */
  constellation: IauConstellation;
  /** Distance to Earth — AU for planets, unitless for Sun/Moon. */
  distance?: number;
}

export type MoonPhaseKey =
  | 'new'
  | 'waxingCrescent'
  | 'firstQuarter'
  | 'waxingGibbous'
  | 'full'
  | 'waningGibbous'
  | 'lastQuarter'
  | 'waningCrescent';

interface MoonReading {
  /** Apparent geocentric ecliptic longitude, degrees [0..360). */
  eclipticLongitude: number;
  /** Geocentric ecliptic latitude, degrees. */
  eclipticLatitude: number;
  /** Right ascension, hours [0..24). */
  ra: number;
  /** Declination, degrees. */
  dec: number;
  /** Sun-Moon elongation, degrees [0..360). */
  elongation: number;
  /** Illuminated fraction [0..1]. */
  illumination: number;
  /** Stable phase identifier — localized by consumers via i18n. */
  phaseKey: MoonPhaseKey;
  /** IAU constellation the Moon currently sits in. */
  constellation: IauConstellation;
  /** Earth-Moon distance (km) — varies from ~363 000 (perigee) to ~405 000 (apogee). */
  distanceKm: number;
}

export interface CelestialReading {
  julianDay: number;
  /** Tropical ecliptic longitude (equinox-of-date frame), degrees [0..360). */
  sunEclipticLongitude: number;
  /** Sidereal ecliptic longitude (IAU/ICRS frame), degrees [0..360). */
  sunSiderealLongitude: number;
  /** Sun right ascension, hours [0..24). */
  sunRA: number;
  /** Sun declination, degrees. */
  sunDec: number;
  /** Apparent obliquity of the ecliptic, degrees. */
  obliquity: number;
  /** Apparent sidereal time at Greenwich, hours [0..24). */
  greenwichSiderealTime: number;
  /** Local sidereal time, hours [0..24). */
  localSiderealTime: number;
  /** Ascendant: ecliptic longitude of the eastern horizon, degrees [0..360). */
  ascendantLongitude: number;
  /** IAU constellation crossed by the Sun at birth. */
  trueConstellation: IauConstellation;
  /** "Classic" tropical zodiac sign (naive 30°-per-sign mapping). */
  tropicalSign: ZodiacSign;
  /**
   * Cumulative drift of the tropical zodiac vs. the IAU sky, in days.
   * = tropical longitude of the IAU Aries boundary, projected to solar days.
   * Around 80 BCE the vernal equinox sat on the IAU Pisces→Aries boundary
   * (gap = 0). Precession (~50.29″/yr) has widened it since: ~30 d by 2026.
   */
  precessionGapDays: number;
  /** Number of days the Sun actually spends in this constellation. */
  daysInConstellation: number;
  /** Moon position and phase. */
  moon: MoonReading;
  /** Constellation rising on the eastern horizon (Ascendant). */
  ascendantConstellation: IauConstellation;
  /** All celestial bodies (Sun, Moon, 8 planets + Pluto). */
  bodies: CelestialBody[];
  /** Original input, kept for display. */
  input: BirthInput;
}

type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type IauConstellation = ZodiacSign | 'Ophiuchus';

// ─── Numerical helpers ──────────────────────────────────────────────────────

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const norm24  = (x: number) => ((x % 24) + 24) % 24;

// ─── Calendar → Julian Day (Meeus 7.1) ──────────────────────────────────────

/**
 * Julian Day from a JS Date (interpreted as UTC).
 *
 * ⚠ Reminder for callers: `new Date(YYYY, M, D)` interprets M as zero-based
 * (January = 0, February = 1, …). For January 18 1992, use
 * `new Date(Date.UTC(1992, 0, 18))` — *not* `new Date(1992, 1, 18)`, which
 * would yield February 18. Here `getUTCMonth()` returns 0..11 and we add 1
 * to obtain the 1..12 calendar month used by Meeus.
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
  const B = 2 - A + Math.floor(A / 4); // Gregorian calendar

  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    D + B - 1524.5
  );
}

// ─── Sun: apparent ecliptic longitude (Meeus ch. 25) ────────────────────────

interface SunSolution { lambda: number; obliquity: number; }

function sunApparentLongitude(jd: number): SunSolution {
  const T = (jd - 2451545.0) / 36525;

  // Geometric mean longitude.
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  // Mean anomaly.
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mr = M * DEG;

  // Equation of centre.
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);

  const trueLong = L0 + C;

  // Nutation + aberration correction (Meeus 25.8, simplified).
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG);

  // Mean obliquity (Meeus 22.2) + nutation correction.
  const eps0 =
    23 + 26 / 60 + 21.448 / 3600 -
    (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
  const eps = eps0 + 0.00256 * Math.cos(omega * DEG);

  return { lambda: norm360(lambda), obliquity: eps };
}

// ─── Moon: apparent geocentric position (Meeus ch. 47, abridged) ────────────
// Accuracy: ~10' in longitude, ~3' in latitude — comfortably enough for the
// 3D scene and the phase determination.

interface MoonSolution {
  lon: number;        // geocentric ecliptic longitude (deg)
  lat: number;        // geocentric ecliptic latitude  (deg)
  distanceKm: number; // Earth-Moon distance (km)
}

function moonApparentPosition(jd: number): MoonSolution {
  const T = (jd - 2451545.0) / 36525;

  // Fundamental arguments (Meeus 47.1-47.5).
  const Lp = norm360(218.3164591 + 481267.88134236 * T - 0.0013268 * T * T);  // mean longitude
  const D  = norm360(297.8502042 + 445267.1115168  * T - 0.00163   * T * T);  // mean elongation
  const M  = norm360(357.5291092 + 35999.0502909   * T - 0.0001536 * T * T);  // Sun's mean anomaly
  const Mp = norm360(134.9634114 + 477198.8676313  * T + 0.0089970 * T * T);  // Moon's mean anomaly
  const F  = norm360( 93.2720993 + 483202.0175273  * T - 0.0034029 * T * T);  // argument of latitude

  const sind = (x: number) => Math.sin(x * DEG);
  const cosd = (x: number) => Math.cos(x * DEG);

  // Dominant periodic terms for the longitude (Meeus table 47.A, top 10).
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

  // Dominant periodic terms for the latitude (Meeus table 47.B).
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

  // Dominant terms for the distance, in km (Meeus table 47.A, column B).
  // Residual accuracy ~100 km, sufficient for rendering (apogee ~405k,
  // perigee ~363k → the orbital modulation stays readable).
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

// ─── Apparent sidereal time at Greenwich (Meeus 12.4) ───────────────────────

function greenwichSiderealTime(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const theta =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return norm24(norm360(theta) / 15);
}

// ─── Ascendant: ecliptic longitude of the eastern horizon (Meeus ch. 14) ────

function ascendant(lstHours: number, latDeg: number, epsDeg: number): number {
  const lst = lstHours * 15 * DEG;
  const lat = latDeg * DEG;
  const eps = epsDeg * DEG;

  // Meeus 14.6: tan(asc) = -cos(LST) / (sin(LST)·cos(eps) + tan(lat)·sin(eps))
  const y = -Math.cos(lst);
  const x = Math.sin(lst) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);
  const asc = Math.atan2(y, x) * RAD;

  // The ascendant must sit in the quadrant that follows the MC (Medium Coeli).
  // The atan2 above returns [-180, 180]; normalize to [0, 360).
  return norm360(asc);
}

// ─── IAU boundaries of the 13 zodiacal constellations ───────────────────────
// Ecliptic longitudes (ICRS frame) where the Sun ENTERS each constellation —
// from the IAU 1930 boundaries (E. Delporte). Each row reads: "from this
// longitude the Sun sits in this constellation, and will stay there until
// the next row's longitude." The accompanying date is the Sun's transit at
// this longitude for the current epoch; precession (~50.29″/yr) drifts it.

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
  { start: 247.75, constellation: 'Ophiuchus',   approximateEntryDate: '29 novembre', durationDays: 19 }, // ★ the 13th
  { start: 266.60, constellation: 'Sagittarius', approximateEntryDate: '18 décembre', durationDays: 32 },
  { start: 299.71, constellation: 'Capricorn',   approximateEntryDate: '20 janvier',  durationDays: 27 },
  { start: 327.86, constellation: 'Aquarius',    approximateEntryDate: '16 février',  durationDays: 24 },
  { start: 351.61, constellation: 'Pisces',      approximateEntryDate: '12 mars',     durationDays: 38 },
];

export function getIauBoundaries() {
  return IAU_BOUNDARIES;
}

/** Map a sidereal ecliptic longitude [0..360) to an IAU constellation. */
function constellationFromSiderealLongitude(lon: number): IauConstellation {
  const x = norm360(lon);
  let result: IauConstellation = 'Pisces'; // wrap: below 29.08° we're still in Pisces
  for (const b of IAU_BOUNDARIES) {
    if (x >= b.start) result = b.constellation;
  }
  return result;
}

/** Days the Sun actually spends in this constellation. */
function daysInConstellation(c: IauConstellation): number {
  return IAU_BOUNDARIES.find(b => b.constellation === c)?.durationDays ?? 30;
}

// ─── Tropical astrology (comparison reference) ──────────────────────────────

const TROPICAL_SIGNS: ZodiacSign[] = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

function tropicalSignFromLongitude(lon: number): ZodiacSign {
  return TROPICAL_SIGNS[Math.floor(norm360(lon) / 30)];
}

/**
 * Drift of the vernal point since J2000, in degrees (~50.29″/yr).
 * Used to convert a current-epoch tropical longitude into a J2000 (ICRS)
 * ecliptic longitude, where the IAU boundaries are tabulated.
 *
 * NB: this is NOT the cumulative zodiac drift since its historical anchor —
 * for that, see {@link zodiacDriftDegrees}.
 */
export function precessionOffset(jd: number): number {
  const yearsSinceJ2000 = (jd - 2451545.0) / 365.25;
  return (50.29 / 3600) * yearsSinceJ2000;
}

/**
 * Angular gap between 0° tropical (the current vernal point) and the start
 * of the IAU Aries constellation, projected onto the ecliptic. This is the
 * "real" drift of the zodiac against the sky: around 80 BCE the vernal
 * point sat on the IAU Pisces→Aries boundary (gap = 0); precession has
 * widened that gap by ~50.29″/yr since. By 2026, gap ≈ 29.4° ≈ 30 solar days.
 */
export function zodiacDriftDegrees(jd: number): number {
  return IAU_BOUNDARIES[0].start + precessionOffset(jd);
}

// ─── Ecliptic → equatorial (Meeus 13.3) ─────────────────────────────────────

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

// ─── Moon phase ─────────────────────────────────────────────────────────────

function phaseKey(elongation: number): MoonPhaseKey {
  const e = norm360(elongation);
  if (e < 22.5 || e >= 337.5) return 'new';
  if (e < 67.5)                return 'waxingCrescent';
  if (e < 112.5)               return 'firstQuarter';
  if (e < 157.5)               return 'waxingGibbous';
  if (e < 202.5)               return 'full';
  if (e < 247.5)               return 'waningGibbous';
  if (e < 292.5)               return 'lastQuarter';
  return 'waningCrescent';
}

/** Convert a tropical longitude to an IAU constellation. */
function eclipticToConstellation(lonTropical: number, jd: number): IauConstellation {
  const offset = precessionOffset(jd);
  return constellationFromSiderealLongitude(norm360(lonTropical - offset));
}

// ─── Main entry point ───────────────────────────────────────────────────────

export function computeReading(input: BirthInput): CelestialReading {
  const jd = toJulianDay(input.date);
  const { lambda: sunTropical, obliquity: eps } = sunApparentLongitude(jd);

  // Sun equatorial position.
  const sunEq = eclipticToEquatorial(sunTropical, 0, eps);

  const gst = greenwichSiderealTime(jd);
  const lst = norm24(gst + input.longitude / 15);
  const asc = ascendant(lst, input.latitude, eps);

  // Precession + constellation the Sun is crossing.
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

  // Moon.
  const moon = moonApparentPosition(jd);
  const moonEq = eclipticToEquatorial(moon.lon, moon.lat, eps);
  const elongation = norm360(moon.lon - sunTropical);
  const illumination = (1 - Math.cos(elongation * DEG)) / 2;

  // Build the unified celestial-bodies array.
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

  // Planets.
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
    precessionGapDays: zodiacDriftDegrees(jd) / (360 / 365.25),
    daysInConstellation: daysInConstellation(trueConstellation),
    moon: {
      eclipticLongitude: moon.lon,
      eclipticLatitude: moon.lat,
      ra: moonEq.ra,
      dec: moonEq.dec,
      elongation,
      illumination,
      phaseKey: phaseKey(elongation),
      constellation: eclipticToConstellation(moon.lon, jd),
      distanceKm: moon.distanceKm,
    },
    ascendantConstellation: eclipticToConstellation(asc, jd),
    bodies,
    input,
  };
}

// ─── HUD formatting helpers ─────────────────────────────────────────────────

export function formatRA(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.round(((hours - h) * 60 - m) * 60);
  return `${h.toString().padStart(2,'0')}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
}

// ─── Live telemetry — used by the HUD header in empty state ──────────────────

export interface LiveTelemetry {
  /** Local Apparent Sidereal Time at the observer, in hours (0–24). */
  lstHours: number;
  /** Julian Day for the instant. */
  julianDay: number;
}

/**
 * Cheap derivation of LST + JD for the live header. Both are also
 * computed inside `computeReading` for natal mode; keeping a separate
 * call avoids dragging the full-reading engine on every tick.
 */
export function liveTelemetry(date: Date, longitudeDeg: number): LiveTelemetry {
  const jd = toJulianDay(date);
  const gst = greenwichSiderealTime(jd);
  const lst = norm24(gst + longitudeDeg / 15);
  return { lstHours: lst, julianDay: jd };
}

export function formatLST(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}`;
}
