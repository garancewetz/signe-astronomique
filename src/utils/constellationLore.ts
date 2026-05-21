import type { IauConstellation } from '@/features/astronomy';
import type { Locale } from '../i18n';

interface ConstellationLore {
  /** French display name. */
  fr: string;
  /** English display name. */
  en: string;
  /** Official Latin name. */
  latin: string;
  /** Brightest alpha star. */
  brightestStar: string;
  /** Cultural context — French (not displayed; documentary reserve). */
  myth: string;
  /** Cultural context — English. */
  mythEn: string;
  /** Short outreach blurb — French (astronomical, sensitive tone). */
  poetic: string;
  /** Short outreach blurb — English. */
  poeticEn: string;
}

export const CONSTELLATION_LORE: Record<IauConstellation, ConstellationLore> = {
  Aries: {
    fr: 'Bélier',
    en: 'Aries',
    latin: 'Aries',
    brightestStar: 'Hamal (α Arietis)',
    myth: 'Le bélier à la toison d\'or qui sauva Phrixos sur la mer Égée.',
    mythEn: 'The golden-fleeced ram that rescued Phrixus across the Aegean Sea.',
    poetic: 'Constellation modeste sur le ciel, mais elle contient le point vernal : intersection de l\'écliptique et de l\'équateur céleste, référence du calendrier tropical.',
    poeticEn: 'A modest constellation in the sky, yet it holds the vernal point: the intersection of the ecliptic and the celestial equator, anchor of the tropical calendar.',
  },
  Taurus: {
    fr: 'Taureau',
    en: 'Taurus',
    latin: 'Taurus',
    brightestStar: 'Aldébaran (α Tauri)',
    myth: 'Zeus métamorphosé pour enlever Europe sur l\'île de Crète.',
    mythEn: 'Zeus transformed to abduct Europa to the island of Crete.',
    poetic: 'Aldébaran, rouge et brillante, compte parmi les étoiles les plus anciennement nommées. L\'amas des Pléiades brille tout près sur la voûte.',
    poeticEn: 'Aldebaran, red and bright, is one of the earliest stars to have been given a name. The Pleiades cluster glitters just nearby.',
  },
  Gemini: {
    fr: 'Gémeaux',
    en: 'Gemini',
    latin: 'Gemini',
    brightestStar: 'Pollux (β Geminorum)',
    myth: 'Castor et Pollux, jumeaux inséparables — l\'un mortel, l\'autre divin.',
    mythEn: 'Castor and Pollux, inseparable twins — one mortal, the other divine.',
    poetic: 'À l\'œil nu, Castor (~51 al) et Pollux (~34 al) paraissent jumelles ; ce sont en réalité deux systèmes stellaires distincts, séparés d\'environ 17 années-lumière dans la Voie lactée.',
    poeticEn: 'To the naked eye, Castor (~51 ly) and Pollux (~34 ly) look like twins; they are in fact two distinct stellar systems, about 17 light-years apart in the Milky Way.',
  },
  Cancer: {
    fr: 'Cancer',
    en: 'Cancer',
    latin: 'Cancer',
    brightestStar: 'Tarf (β Cancri)',
    myth: 'Le crabe envoyé par Héra pour distraire Hercule pendant son combat contre l\'Hydre.',
    mythEn: 'The crab sent by Hera to distract Heracles during his fight against the Hydra.',
    poetic: 'La plus discrète des constellations zodiacales — un ciel noir, loin des villes, est nécessaire pour la voir. Elle abrite pourtant l\'amas de la Ruche (M44) : un essaim d\'environ 1 000 étoiles à 580 années-lumière.',
    poeticEn: 'The faintest of the zodiacal constellations — you need a dark sky, far from cities, to make it out. Yet it hosts the Beehive cluster (M44): a swarm of roughly 1,000 stars at 580 light-years.',
  },
  Leo: {
    fr: 'Lion',
    en: 'Leo',
    latin: 'Leo',
    brightestStar: 'Régulus (α Leonis)',
    myth: 'Le lion de Némée, à la peau invulnérable, tué par Hercule.',
    mythEn: 'The Nemean lion, its hide invulnerable, slain by Heracles.',
    poetic: 'Régulus, le « petit roi », est si proche de l\'écliptique que la Lune l\'occulte régulièrement.',
    poeticEn: 'Regulus, the “little king”, sits so close to the ecliptic that the Moon occults it regularly.',
  },
  Virgo: {
    fr: 'Vierge',
    en: 'Virgo',
    latin: 'Virgo',
    brightestStar: 'Spica (α Virginis)',
    myth: 'Astrée, déesse de la justice, dernière à quitter la Terre à l\'âge de fer.',
    mythEn: 'Astraea, goddess of justice, the last to leave Earth at the iron age.',
    poetic: 'La deuxième plus grande constellation du ciel. Le Soleil y passe environ 45 jours par an sur l\'écliptique — le passage le plus long dans cette région.',
    poeticEn: 'The second-largest constellation in the sky. The Sun spends about 45 days a year crossing it along the ecliptic — the longest passage in this region.',
  },
  Libra: {
    fr: 'Balance',
    en: 'Libra',
    latin: 'Libra',
    brightestStar: 'Zubeneschamali (β Librae)',
    myth: 'Anciennement les pinces du Scorpion, puis figurée comme une balance.',
    mythEn: 'Once the claws of the Scorpion, later depicted as a balance.',
    poetic: 'Seule constellation du bandeau zodiacal IAU représentant un objet fabriqué plutôt qu\'un animal.',
    poeticEn: 'The only constellation along the IAU zodiacal band depicting a crafted object rather than an animal.',
  },
  Scorpio: {
    fr: 'Scorpion',
    en: 'Scorpius',
    latin: 'Scorpius',
    brightestStar: 'Antarès (α Scorpii)',
    myth: 'Envoyé par Artémis pour tuer le chasseur Orion ; placés à l\'opposé du ciel pour qu\'ils ne se croisent jamais.',
    mythEn: 'Sent by Artemis to kill the hunter Orion; placed on opposite sides of the sky so they never meet.',
    poetic: 'Antarès — le « rival de Mars » — est une supergéante rouge si vaste qu\'elle engloutirait l\'orbite de Mars. Le Soleil n\'y reste que 6 jours.',
    poeticEn: 'Antares — the “rival of Mars” — is a red supergiant so vast that, placed where the Sun is, it would swallow Mars’s orbit. The Sun only spends about 6 days crossing it.',
  },
  Ophiuchus: {
    fr: 'Ophiuchus / Serpentaire',
    en: 'Ophiuchus / Serpent Bearer',
    latin: 'Ophiuchus',
    brightestStar: 'Rasalhague (α Ophiuchi)',
    myth: 'Asclépios, le médecin divin, tenant le serpent symbole de guérison. Foudroyé par Zeus pour avoir ressuscité les morts.',
    mythEn: 'Asclepius, the divine physician, holding the serpent symbol of healing. Struck down by Zeus for raising the dead.',
    poetic: 'Le Soleil suit l\'écliptique à travers cette constellation environ 18 jours par an. Les limites IAU et les douze secteurs tropiques égaux ne recouvrent pas la même géométrie.',
    poeticEn: 'The Sun follows the ecliptic through this constellation roughly 18 days a year. The IAU borders and the twelve equal tropical sectors don’t cover the same geometry.',
  },
  Sagittarius: {
    fr: 'Sagittaire',
    en: 'Sagittarius',
    latin: 'Sagittarius',
    brightestStar: 'Kaus Australis (ε Sagittarii)',
    myth: 'Le centaure Chiron, archer cosmique. Sa flèche pointe vers Antarès.',
    mythEn: 'The centaur Chiron, cosmic archer. His arrow points at Antares.',
    poetic: 'Cette région du ciel cache le centre de notre galaxie : Sagittarius A*, un trou noir supermassif de 4 millions de masses solaires.',
    poeticEn: 'This region of the sky hides our galaxy’s center: Sagittarius A*, a supermassive black hole of 4 million solar masses.',
  },
  Capricorn: {
    fr: 'Capricorne',
    en: 'Capricorn',
    latin: 'Capricornus',
    brightestStar: 'Deneb Algedi (δ Capricorni)',
    myth: 'Pan, transformé en chèvre-poisson en fuyant le monstre Typhon.',
    mythEn: 'Pan, turned into a goat-fish while fleeing the monster Typhon.',
    poetic: 'Une constellation pâle, sans étoile vraiment brillante — c\'est pourtant en l\'observant que Le Verrier a annoncé en 1846, par le calcul seul, l\'existence de Neptune, retrouvée la même nuit à moins de 1° de la position prédite.',
    poeticEn: 'A faint constellation, with no truly bright star — yet it was here that Neptune was discovered in 1846: Le Verrier predicted its position from calculation alone, and Galle found it that same night, less than 1° from the predicted spot.',
  },
  Aquarius: {
    fr: 'Verseau',
    en: 'Aquarius',
    latin: 'Aquarius',
    brightestStar: 'Sadalsuud (β Aquarii)',
    myth: 'Ganymède, l\'échanson des dieux, versant l\'éternelle eau de l\'Olympe.',
    mythEn: 'Ganymede, cup-bearer of the gods, pouring the eternal water of Olympus.',
    poetic: 'La précession fait lentement migrer le point vernal le long de l\'écliptique ; dans plusieurs siècles il traversera davantage cette région du ciel.',
    poeticEn: 'Precession slowly carries the vernal point along the ecliptic; in several centuries it will have moved further into this region of the sky.',
  },
  Pisces: {
    fr: 'Poissons',
    en: 'Pisces',
    latin: 'Pisces',
    brightestStar: 'Alpherg (η Piscium)',
    myth: 'Aphrodite et Éros transformés en poissons, attachés par un ruban pour ne pas se perdre.',
    mythEn: 'Aphrodite and Eros turned into fishes, tied by a ribbon so they wouldn’t lose each other.',
    poetic: 'Le point vernal se situe aujourd\'hui dans cette constellation sur l\'écliptique : décalage historique inévitable avec les douze secteurs égaux du calendrier tropical.',
    poeticEn: 'The vernal point sits today inside this constellation along the ecliptic — the inevitable historical drift away from the twelve equal sectors of the tropical calendar.',
  },
};

/** Locale-aware constellation name. */
export function loreName(c: IauConstellation, locale: Locale): string {
  const l = CONSTELLATION_LORE[c];
  return locale === 'en' ? l.en : l.fr;
}

/** Locale-aware poetic blurb. */
export function lorePoetic(c: IauConstellation, locale: Locale): string {
  const l = CONSTELLATION_LORE[c];
  return locale === 'en' ? l.poeticEn : l.poetic;
}
