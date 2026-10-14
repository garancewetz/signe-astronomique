/**
 * Data behind the static sign pages (/signe/<slug>/ and /signes/).
 *
 * Every date shown on those pages comes from the same engine as the app:
 * we sample the Sun once a day (12:00 UTC) over a reference year and read
 * its horoscope sign and its true IAU constellation via `sunSigns`. The
 * boundary days shift by about one day from one year to the next.
 */
import { sunSigns, type IauConstellation } from '../src/features/astronomy/astroEngine';

export const REFERENCE_YEAR = 2026;

/** Zodiac constellations in the order the Sun crosses them. */
export const ZODIAC_ORDER: readonly IauConstellation[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra',
  'Scorpio', 'Ophiuchus', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

interface SignFr {
  slug: string;
  /** Bare name: « tu es Balance ». */
  name: string;
  /** With article: « la Balance », « les Gémeaux », « Ophiuchus ». */
  the: string;
  /** With « de »: « de la Balance », « du Bélier », « d'Ophiuchus ». */
  of: string;
  glyph: string;
}

// U+FE0E asks for the text (not emoji) presentation of each glyph.
export const SIGN_FR: Record<IauConstellation, SignFr> = {
  Aries:       { slug: 'belier',     name: 'Bélier',     the: 'le Bélier',     of: 'du Bélier',      glyph: '♈︎' },
  Taurus:      { slug: 'taureau',    name: 'Taureau',    the: 'le Taureau',    of: 'du Taureau',     glyph: '♉︎' },
  Gemini:      { slug: 'gemeaux',    name: 'Gémeaux',    the: 'les Gémeaux',   of: 'des Gémeaux',    glyph: '♊︎' },
  Cancer:      { slug: 'cancer',     name: 'Cancer',     the: 'le Cancer',     of: 'du Cancer',      glyph: '♋︎' },
  Leo:         { slug: 'lion',       name: 'Lion',       the: 'le Lion',       of: 'du Lion',        glyph: '♌︎' },
  Virgo:       { slug: 'vierge',     name: 'Vierge',     the: 'la Vierge',     of: 'de la Vierge',   glyph: '♍︎' },
  Libra:       { slug: 'balance',    name: 'Balance',    the: 'la Balance',    of: 'de la Balance',  glyph: '♎︎' },
  Scorpio:     { slug: 'scorpion',   name: 'Scorpion',   the: 'le Scorpion',   of: 'du Scorpion',    glyph: '♏︎' },
  Ophiuchus:   { slug: 'ophiuchus',  name: 'Ophiuchus',  the: 'Ophiuchus',     of: 'd’Ophiuchus',    glyph: '⛎︎' },
  Sagittarius: { slug: 'sagittaire', name: 'Sagittaire', the: 'le Sagittaire', of: 'du Sagittaire',  glyph: '♐︎' },
  Capricorn:   { slug: 'capricorne', name: 'Capricorne', the: 'le Capricorne', of: 'du Capricorne',  glyph: '♑︎' },
  Aquarius:    { slug: 'verseau',    name: 'Verseau',    the: 'le Verseau',    of: 'du Verseau',     glyph: '♒︎' },
  Pisces:      { slug: 'poissons',   name: 'Poissons',   the: 'les Poissons',  of: 'des Poissons',   glyph: '♓︎' },
};

/** Where to look for each constellation — hand-written, for a French sky. */
export const SKY_TIP: Record<IauConstellation, string> = {
  Aries: 'Cherche trois étoiles en petite ligne courbée, entre les Pléiades et le grand carré de Pégase : Hamal est la plus brillante.',
  Taurus: 'Facile en hiver : suis la ceinture d’Orion vers le haut à droite jusqu’à Aldébaran, l’œil rouge du Taureau, puis les Pléiades un peu plus loin.',
  Gemini: 'Deux étoiles presque jumelles, Castor et Pollux, brillent côte à côte au-dessus d’Orion les soirs d’hiver et de début de printemps.',
  Cancer: 'Très discrète : il faut un ciel noir, loin des villes. Aux jumelles, l’amas de la Ruche apparaît comme une petite tache d’étoiles entre Pollux et Régulus.',
  Leo: 'Au printemps, repère un point d’interrogation à l’envers (la Faucille) qui se termine sur Régulus, puis le triangle de la queue du Lion.',
  Virgo: 'Prolonge l’arc du manche de la Grande Ourse jusqu’à Arcturus, puis continue tout droit : la prochaine étoile brillante est Spica.',
  Libra: 'Pâle et basse sur l’horizon sud au printemps, entre Spica (Vierge) et Antarès (Scorpion) : ses deux étoiles principales forment les plateaux.',
  Scorpio: 'Les soirs d’été, très bas au sud depuis la France : Antarès, rouge orangé, marque le cœur du Scorpion. Sa queue reste souvent sous l’horizon.',
  Ophiuchus: 'Une grande figure pâle, haut au-dessus du Scorpion les soirs d’été. Rasalhague, sa tête, brille non loin de Véga et du grand triangle d’été.',
  Sagittarius: 'Bas au sud les soirs d’été, ses étoiles dessinent une « théière » posée sur la Voie lactée, juste devant le centre de notre galaxie.',
  Capricorn: 'Un grand triangle d’étoiles pâles, bas au sud les soirs de fin d’été, à gauche du Sagittaire.',
  Aquarius: 'Discret, au sud du grand carré de Pégase les soirs d’automne : cherche le petit « Y » de la cruche, autour de Sadalmelik.',
  Pisces: 'Sous le grand carré de Pégase les soirs d’automne, un petit cercle d’étoiles faibles marque le poisson de l’ouest. Ciel noir conseillé.',
};

export interface Day {
  date: Date;
  tropical: IauConstellation;
  constellation: IauConstellation;
}

export interface Run {
  sign: IauConstellation;
  /** Indices into the reference-year timeline, in order (may wrap Dec → Jan). */
  idx: number[];
}

/** One sample per day of the reference year, at 12:00 UTC. */
function buildTimeline(year: number): Day[] {
  const days: Day[] = [];
  for (let t = Date.UTC(year, 0, 1, 12); t < Date.UTC(year + 1, 0, 1, 12); t += 86_400_000) {
    const date = new Date(t);
    days.push({ date, ...sunSigns(date) });
  }
  return days;
}

/** Group consecutive days by sign, treating the year as a cycle. */
function cyclicRuns(days: Day[], key: (d: Day) => IauConstellation): Run[] {
  const n = days.length;
  // Start right after a sign change so no run is split at Dec 31 → Jan 1.
  let start = 0;
  while (key(days[start]) === key(days[(start - 1 + n) % n])) start++;
  const runs: Run[] = [];
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    const sign = key(days[i]);
    const last = runs[runs.length - 1];
    if (last && last.sign === sign) last.idx.push(i);
    else runs.push({ sign, idx: [i] });
  }
  return runs;
}

/** Split a list of day indices into consecutive groups by `key`. */
export function splitBy(days: Day[], idx: number[], key: (d: Day) => IauConstellation): Run[] {
  const runs: Run[] = [];
  for (const i of idx) {
    const sign = key(days[i]);
    const last = runs[runs.length - 1];
    if (last && last.sign === sign) last.idx.push(i);
    else runs.push({ sign, idx: [i] });
  }
  return runs;
}

/** The longest group — « tu es sûrement … ». */
export function majority(runs: Run[]): Run {
  const totals = new Map<IauConstellation, number>();
  for (const r of runs) totals.set(r.sign, (totals.get(r.sign) ?? 0) + r.idx.length);
  const best = [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return runs.filter(r => r.sign === best).sort((a, b) => b.idx.length - a.idx.length)[0];
}

export const TIMELINE = buildTimeline(REFERENCE_YEAR);

/** Horoscope sign → its run of days (12 entries, no Ophiuchus). */
export const TROPICAL_RUNS = new Map(
  cyclicRuns(TIMELINE, d => d.tropical).map(r => [r.sign, r]),
);

/** True IAU constellation → its run of days (13 entries). */
export const IAU_RUNS = new Map(
  cyclicRuns(TIMELINE, d => d.constellation).map(r => [r.sign, r]),
);

/** Days between the start of the horoscope dates and of the real dates. */
export function shiftDays(sign: IauConstellation): number | null {
  const tropical = TROPICAL_RUNS.get(sign);
  const iau = IAU_RUNS.get(sign);
  if (!tropical || !iau) return null;
  const n = TIMELINE.length;
  return (iau.idx[0] - tropical.idx[0] + n) % n;
}

/** Index of the day half a year after the middle of the Sun's passage. */
export function oppositionIndex(sign: IauConstellation): number {
  const run = IAU_RUNS.get(sign)!;
  const mid = run.idx[Math.floor(run.idx.length / 2)];
  return (mid + 182) % TIMELINE.length;
}

// ─── French date formatting ──────────────────────────────────────────────────

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/** « 1er nov. », « 23 sept. » — for narrow tables. */
export function frDayShort(date: Date): string {
  const d = date.getUTCDate();
  return `${d === 1 ? '1er' : d} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

/** « 1er novembre », « 23 septembre ». */
export function frDay(date: Date): string {
  const d = date.getUTCDate();
  return `${d === 1 ? '1er' : d} ${MONTHS[date.getUTCMonth()]}`;
}

export function frMonth(date: Date): string {
  return MONTHS[date.getUTCMonth()];
}

/** « du 23 septembre au 22 octobre » (or « le 22 novembre » for one day). */
export function frRange(run: Run, days: Day[] = TIMELINE): string {
  const first = days[run.idx[0]].date;
  const last = days[run.idx[run.idx.length - 1]].date;
  if (run.idx.length === 1) return `le ${frDay(first)}`;
  return `du ${frDay(first)} au ${frDay(last)}`;
}

/** « 23 septembre – 22 octobre » for tables. */
export function frSpan(run: Run, days: Day[] = TIMELINE): string {
  const first = days[run.idx[0]].date;
  const last = days[run.idx[run.idx.length - 1]].date;
  if (run.idx.length === 1) return frDay(first);
  return `${frDay(first)} – ${frDay(last)}`;
}
