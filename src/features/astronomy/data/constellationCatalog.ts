import type { IauConstellation } from '../astroEngine';
import rawCatalog from './constellations.json';

export interface CatalogStar {
  name: string;
  bayer: string;
  /** Right ascension, degrees [0..360) — ICRS J2000 frame. */
  ra: number;
  /** Declination, degrees [-90..+90]. */
  dec: number;
  /** Apparent V-band magnitude. */
  mag: number;
  /** Distance to Earth in light-years (Hipparcos, approximate). */
  distance_ly: number;
}

export interface CatalogConstellation {
  name: string;
  abbreviation: string;
  stars: CatalogStar[];
  lines: Array<[number, number]>;
}

export const CONSTELLATION_CATALOG: CatalogConstellation[] = rawCatalog as CatalogConstellation[];

/** Lookup constellation by IAU 3-letter abbreviation. */
export function findConstellation(
  abbreviation: string,
): CatalogConstellation | null {
  return (
    CONSTELLATION_CATALOG.find((c) => c.abbreviation === abbreviation) ?? null
  );
}

// ─── IAU 3-letter abbreviation → IauConstellation ──────────────────────────
// Only the 13 zodiacal constellations are highlighted (bright lines + label).
// The others get plain star points without any pattern overlay.

const ZODIACAL_BY_ABBR: Record<string, IauConstellation> = {
  Ari: 'Aries',
  Tau: 'Taurus',
  Gem: 'Gemini',
  Cnc: 'Cancer',
  Leo: 'Leo',
  Vir: 'Virgo',
  Lib: 'Libra',
  Sco: 'Scorpio',
  Oph: 'Ophiuchus',
  Sgr: 'Sagittarius',
  Cap: 'Capricorn',
  Aqr: 'Aquarius',
  Psc: 'Pisces',
};

export function isZodiacal(abbreviation: string): boolean {
  return abbreviation in ZODIACAL_BY_ABBR;
}

export function abbrToZodiacal(abbreviation: string): IauConstellation | null {
  return ZODIACAL_BY_ABBR[abbreviation] ?? null;
}
