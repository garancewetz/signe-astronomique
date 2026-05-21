import type { IauConstellation } from '../astroEngine';
import rawCatalog from './constellations.json';

export interface CatalogStar {
  name: string;
  bayer: string;
  /** Ascension droite, degrés [0..360) — frame ICRS J2000 */
  ra: number;
  /** Déclinaison, degrés [-90..+90] */
  dec: number;
  /** Magnitude apparente V-band */
  mag: number;
  /** Distance à la Terre en années-lumière (Hipparcos, approximative) */
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

// ─── Mapping abbréviation IAU 3-lettres → IauConstellation ──────────────────
// Seules les 13 zodiacales sont surlignées (lignes brillantes + label).
// Les autres ne reçoivent que des points d'étoiles, sans pattern.

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
