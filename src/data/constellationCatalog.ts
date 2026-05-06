import type { IauConstellation } from '../utils/astroEngine';
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
}

interface CatalogConstellation {
  name: string;
  abbreviation: string;
  stars: CatalogStar[];
  lines: Array<[number, number]>;
}

export const CONSTELLATION_CATALOG: CatalogConstellation[] = rawCatalog as CatalogConstellation[];

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
