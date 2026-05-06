import type { IauConstellation } from './astroEngine';

interface ConstellationLore {
  /** Nom français */
  fr: string;
  /** Nom latin officiel */
  latin: string;
  /** Étoile alpha la plus brillante */
  brightestStar: string;
  /** Contexte culturel (non affiché ; réserve documentaire) */
  myth: string;
  /** Vulgarisation courte, ton astronomique et sensible */
  poetic: string;
}

export const CONSTELLATION_LORE: Record<IauConstellation, ConstellationLore> = {
  Aries: {
    fr: 'Bélier',
    latin: 'Aries',
    brightestStar: 'Hamal (α Arietis)',
    myth: 'Le bélier à la toison d\'or qui sauva Phrixos sur la mer Égée.',
    poetic: 'Constellation modeste sur le ciel, mais elle contient le point vernal : intersection de l\'écliptique et de l\'équateur céleste, référence du calendrier tropical.',
  },
  Taurus: {
    fr: 'Taureau',
    latin: 'Taurus',
    brightestStar: 'Aldébaran (α Tauri)',
    myth: 'Zeus métamorphosé pour enlever Europe sur l\'île de Crète.',
    poetic: 'Aldébaran, rouge et brillante, compte parmi les étoiles les plus anciennement nommées. L\'amas des Pléiades brille tout près sur la voûte.',
  },
  Gemini: {
    fr: 'Gémeaux',
    latin: 'Gemini',
    brightestStar: 'Pollux (β Geminorum)',
    myth: 'Castor et Pollux, jumeaux inséparables — l\'un mortel, l\'autre divin.',
    poetic: 'Castor et Pollux paraissent jumelles pour l\'œil ; ce sont en réalité deux systèmes stellaires distincts, séparés dans la galaxie.',
  },
  Cancer: {
    fr: 'Cancer',
    latin: 'Cancer',
    brightestStar: 'Tarf (β Cancri)',
    myth: 'Le crabe envoyé par Héra pour distraire Hercule pendant son combat contre l\'Hydre.',
    poetic: 'La plus discrète des constellations zodiacales — un ciel noir, loin des villes, est nécessaire pour la voir. Elle abrite pourtant l\'amas de la Ruche (M44) : un essaim d\'environ 1 000 étoiles à 580 années-lumière.',
  },
  Leo: {
    fr: 'Lion',
    latin: 'Leo',
    brightestStar: 'Régulus (α Leonis)',
    myth: 'Le lion de Némée, à la peau invulnérable, tué par Hercule.',
    poetic: 'Régulus, le « petit roi », est si proche de l\'écliptique que la Lune l\'occulte régulièrement.',
  },
  Virgo: {
    fr: 'Vierge',
    latin: 'Virgo',
    brightestStar: 'Spica (α Virginis)',
    myth: 'Astrée, déesse de la justice, dernière à quitter la Terre à l\'âge de fer.',
    poetic: 'La deuxième plus grande constellation du ciel. Le Soleil y passe environ 45 jours par an sur l\'écliptique — le passage le plus long dans cette région.',
  },
  Libra: {
    fr: 'Balance',
    latin: 'Libra',
    brightestStar: 'Zubeneschamali (β Librae)',
    myth: 'Anciennement les pinces du Scorpion, puis figurée comme une balance.',
    poetic: 'Seule constellation du bandeau zodiacal IAU représentant un objet fabriqué plutôt qu\'un animal.',
  },
  Scorpio: {
    fr: 'Scorpion',
    latin: 'Scorpius',
    brightestStar: 'Antarès (α Scorpii)',
    myth: 'Envoyé par Artémis pour tuer le chasseur Orion ; placés à l\'opposé du ciel pour qu\'ils ne se croisent jamais.',
    poetic: 'Antarès — le « rival de Mars » — est une supergéante rouge si vaste qu\'elle engloutirait l\'orbite de Mars. Le Soleil n\'y reste que 6 jours.',
  },
  Ophiuchus: {
    fr: 'Ophiuchus / Serpentaire',
    latin: 'Ophiuchus',
    brightestStar: 'Rasalhague (α Ophiuchi)',
    myth: 'Asclépios, le médecin divin, tenant le serpent symbole de guérison. Foudroyé par Zeus pour avoir ressuscité les morts.',
    poetic: 'Le Soleil suit l\'écliptique à travers cette constellation environ 18 jours par an. Les limites IAU et les douze secteurs tropiques égaux ne recouvrent pas la même géométrie.',
  },
  Sagittarius: {
    fr: 'Sagittaire',
    latin: 'Sagittarius',
    brightestStar: 'Kaus Australis (ε Sagittarii)',
    myth: 'Le centaure Chiron, archer cosmique. Sa flèche pointe vers Antarès.',
    poetic: 'Cette région du ciel cache le centre de notre galaxie : Sagittarius A*, un trou noir supermassif de 4 millions de masses solaires.',
  },
  Capricorn: {
    fr: 'Capricorne',
    latin: 'Capricornus',
    brightestStar: 'Deneb Algedi (δ Capricorni)',
    myth: 'Pan, transformé en chèvre-poisson en fuyant le monstre Typhon.',
    poetic: 'Une constellation pâle, sans étoile vraiment brillante — c\'est pourtant en l\'observant que Le Verrier a annoncé en 1846, par le calcul seul, l\'existence de Neptune, retrouvée la même nuit à moins de 1° de la position prédite.',
  },
  Aquarius: {
    fr: 'Verseau',
    latin: 'Aquarius',
    brightestStar: 'Sadalsuud (β Aquarii)',
    myth: 'Ganymède, l\'échanson des dieux, versant l\'éternelle eau de l\'Olympe.',
    poetic: 'La précession fait lentement migrer le point vernal le long de l\'écliptique ; dans plusieurs siècles il traversera davantage cette région du ciel.',
  },
  Pisces: {
    fr: 'Poissons',
    latin: 'Pisces',
    brightestStar: 'Alpherg (η Piscium)',
    myth: 'Aphrodite et Éros transformés en poissons, attachés par un ruban pour ne pas se perdre.',
    poetic: 'Le point vernal se situe aujourd\'hui dans cette constellation sur l\'écliptique : décalage historique inévitable avec les douze secteurs égaux du calendrier tropical.',
  },
};
