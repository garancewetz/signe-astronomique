/**
 * Centralised UI copy — the site is French only. Components consume it via
 * `useT()`.
 *
 * Convention:
 *   - Keys are in English, content is French.
 *   - Functions, not template strings, are used when interpolation is needed.
 *   - Data-derived strings (constellation/planet/satellite names) live next to
 *     the data.
 */

export const fr = {
  cockpit: {
    sidebarLabel: 'Panneau latéral',
    skipToMain: 'Aller au contenu principal',
    brand: 'Signe astronomique',
    srTitle: 'Carte du ciel réel',
  },

  errorBoundary: {
    fullscreenTitle: 'Le site a rencontré une erreur.',
    fullscreenDescription:
      'Une erreur inattendue est survenue. Recharge la page pour réessayer. Rien n’est enregistré sur un serveur : aucune donnée n’est perdue.',
    inlineTitle: 'Le rendu 3D a décroché.',
    inlineDescription:
      'La vue céleste n’a pas pu démarrer. Le reste du site fonctionne : recharge la page pour réessayer.',
    label: 'Erreur',
    reload: 'Recharger la page',
    retry: 'Réessayer',
  },

  natalForm: {
    ariaLabel: 'Coordonnées de naissance',
    title: 'Quand es-tu né·e ?',
    dateLabel: 'Date de naissance',
    timeLabel: 'Heure de naissance',
    placeLabel: 'Lieu de naissance',
    detailsToggle: 'Ajouter l’heure et le lieu',
    detailsHint: 'Facultatif pour le signe, nécessaire pour l’ascendant. Sans eux, on calcule à midi.',
    placePlaceholder: 'Ville de naissance…',
    submitIdle: 'Calcule ton vrai signe',
    submitBusy: 'Calcul du ciel…',
    allSignsLink: 'Les vraies dates des 13 signes',
  },

  searchHistory: {
    sectionLabel: 'Récents',
    listAriaLabel: 'Historique des recherches récentes',
    restoreAriaLabel: (date: string, place: string): string =>
      place ? `Recalculer le ${date} à ${place}` : `Recalculer le ${date}`,
    removeAriaLabel: (date: string, place: string): string =>
      place ? `Retirer ${date} à ${place} de l’historique` : `Retirer ${date} de l’historique`,
  },

  cityAutocomplete: {
    errorRateLimit: 'Trop de requêtes. Réessaie dans un instant.',
    errorService: 'Service de recherche indisponible.',
    errorNetwork: 'Connexion impossible. Vérifie ton réseau.',
    /** IETF language for the Nominatim accept-language header. */
    nominatimLang: 'fr',
  },

  signReveal: {
    panelTitle: 'Ton thème',
    closeAriaLabel: 'Fermer',
    whatTitle: 'C’est quoi, ton signe ?',
    alignmentBody: (sign: string): string =>
      `Le jour de ta naissance, vu depuis la Terre, le Soleil était devant la constellation **${sign}**. Ton signe, c’est simplement ça : la constellation derrière le Soleil.`,
    alignmentAriaLabel: (sign: string): string =>
      `Schéma : la Terre, le Soleil et la constellation ${sign} sont alignés.`,
    sun: 'Soleil',
    earth: 'Terre',
    sameBody: (date: string, sign: string): string =>
      `Les dates des horoscopes ont été fixées il y a 2\u202f000\u00a0ans et le ciel a glissé d’environ un mois depuis. Coup de chance : le ${date} tombe dans la période où les deux disent **${sign}**.`,
    differBody: (date: string, horoscope: string, sky: string): string =>
      `Les dates des horoscopes ont été fixées il y a 2\u202f000\u00a0ans. Depuis, l’axe de la Terre a lentement pivoté (la précession) et le ciel a glissé d’environ un mois : le ${date}, le Soleil n’est plus devant ${horoscope}, mais devant **${sky}**.`,
    ophiuchus:
      '**Ophiuchus** est le 13ᵉ signe oublié : le Soleil le traverse chaque année, mais les horoscopes n’en ont gardé que 12.',
    ophiuchusWhy: {
      title: 'Pourquoi Ophiuchus a sa propre zone ?',
      paragraphs: [
        'En 1930, l’Union astronomique internationale a découpé tout le ciel en 88 constellations aux frontières officielles, comme des pays sur une carte. Ces frontières suivent les figures d’étoiles traditionnelles, pas les signes des horoscopes.',
        'Ophiuchus, le Serpentaire, est une figure antique, déjà décrite par Ptolémée il y a près de 2\u202f000\u00a0ans. Ses pieds descendent jusque sur le chemin du Soleil, alors que les étoiles du Scorpion sont surtout plus au sud. Résultat : le Soleil passe à peine une semaine devant le Scorpion, puis près de trois semaines devant Ophiuchus.',
        'Le Scorpion ne peut pas « reprendre » cette zone : ces étoiles ne font pas partie de sa figure. Le découpage reste une convention, mais c’est la convention officielle.',
      ],
      scienceTitle: 'Et les scientifiques ?',
      science:
        'Les astronomes n’utilisent pas de signes : l’astrologie n’est pas une science. Pour eux, une constellation est une zone du ciel qui sert à situer les objets. Dans ce sens, oui : le Soleil traverse officiellement 13 constellations, Ophiuchus compris. Les 12 signes égaux de 30° sont une convention bien plus ancienne, venue de Babylone.',
    },
    revealCta: (sign: string): string => `Voir ${sign} dans le ciel`,
    edgeLeaving: (days: string, next: string): string =>
      `Tu es né·e à **${days}** d’une frontière : juste après, le Soleil passait dans la constellation voisine, ${next}.`,
    edgeEntered: (days: string, prev: string): string =>
      `Tu es né·e à **${days}** d’une frontière : juste avant, le Soleil était encore dans la constellation voisine, ${prev}.`,
    edgeDays: (n: number): string => (n < 1 ? 'moins d’un jour' : n === 1 ? '1 jour' : `${n} jours`),
    edgeAddTime: 'À ce point-là, l’heure peut compter : ajoute ton heure et ton lieu de naissance pour être sûr·e.',
    skyBandHint:
      'Dans le ciel, le trait doré sur le chemin du Soleil montre la zone officielle de ta constellation. Les traits bleus, eux, ne relient que ses étoiles les plus brillantes.',
    allSignsLink: 'Les vraies dates des 13 signes',
    trueSignLabel: 'Ton vrai signe',
    notHoroscope: (horoscope: string): string => `Et non ${horoscope}, comme le dit ton horoscope.`,
    sameAsHoroscope: 'Pour une fois, ton horoscope a raison.',
    timeUnknown: 'heure inconnue',
    placeUnknown: 'lieu inconnu',
    chartTitle: 'Ton thème, dans le vrai ciel',
    chartIntro:
      'Pour chaque astre, le signe que donne l’horoscope, et la constellation qui était vraiment derrière lui à ta naissance.',
    chartCols: { body: 'Astre', horoscope: 'Horoscope', sky: 'Vrai ciel' },
    ascendant: 'Ascendant',
    ascendantBody: (sign: string): string =>
      `À l’heure de ta naissance, la constellation qui se levait à l’horizon est était **${sign}** : c’est ton vrai ascendant.`,
    ascendantAriaLabel: (sign: string): string =>
      `L’ascendant, ${sign}, se levait à l’horizon est.`,
    eastShort: 'E',
    westShort: 'O',
    horizonLegend: (sign: string): string =>
      `Horizon à ta naissance. À l’est (E), ce qui se levait : **${sign}**, ton ascendant.`,
    sunAtBirth: {
      rising: 'Le Soleil se levait à ce moment-là : il était lui aussi à l’horizon est, c’est pour ça que la ligne de l’horizon et celle du Soleil se superposent.',
      day: 'Il faisait jour : le Soleil était au-dessus de l’horizon, entre l’est et l’ouest.',
      setting: 'Le Soleil se couchait à ce moment-là : il était à l’horizon ouest, à l’opposé de l’ascendant.',
      night: 'Il faisait nuit : le Soleil était sous l’horizon.',
    },
    ascendantNeedsTime: 'Ton ascendant dépend de l’heure exacte de ta naissance : sans elle, on ne peut pas le calculer.',
    addBirthTime: 'Ajouter mon heure de naissance',
    addBirthTimeShort: 'ajouter l’heure',
    ascendantNeedsPlace: 'Ton ascendant dépend aussi du lieu de naissance : sans lui, on ne peut pas le calculer.',
    addBirthPlace: 'Ajouter mon lieu de naissance',
    addBirthPlaceShort: 'ajouter le lieu',
    chartNotes: [
      { term: 'Soleil', text: 'la constellation derrière le Soleil, c’est ton signe.' },
      { term: 'Lune', text: 'celle devant laquelle se trouvait la Lune. Elle en change tous les deux à trois jours.' },
      { term: 'Ascendant', text: 'celle qui se levait à l’est à ta naissance. Elle change en moyenne toutes les deux heures.' },
    ],
    method:
      'Méthode : positions calculées avec les algorithmes de Jean Meeus (écart de moins de 0,1°), constellations selon les frontières officielles de l’Union astronomique internationale (1930).',
    methodLink: 'Sources',
    moonNeedsTime: 'Sans l’heure, la Lune peut avoir changé de constellation dans la journée.',
    share: 'Partager',
  },

  analysisCta: {
    openAriaLabel: 'Voir mon vrai signe',
  },

  mobile: {
    coordinatesModal: {
      ariaLabel: 'Mes coordonnées de naissance',
      sectionLabel: 'Ton vrai signe',
      title: 'Ta naissance',
      closeAriaLabel: 'Fermer',
      editAriaLabel: 'Modifier mes coordonnées de naissance',
    },
    menu: {
      legend: { label: 'Légende' },
      explore: { label: 'Liens utiles (cartes du ciel, éphémérides)' },
      allSigns: { label: 'Les vraies dates des 13 signes' },
      share: {
        label: 'Partager mon signe',
        sublabelCopied: 'Lien copié !',
        sublabelLocked: 'Calcule d’abord ton signe',
      },
      exportView: { label: 'Enregistrer le ciel en image' },
      exportReport: {
        label: 'Télécharger mon thème (PDF)',
        sublabelLocked: 'Calcule d’abord ton signe',
      },
    },
    cockpit: {
      mainAriaLabel: 'Panneau',
      navAriaLabel: 'Navigation principale',
    },
    legend: { ariaLabel: 'Légende' },
    tabs: {
      coords: 'Naissance',
      analysis: 'Mon thème',
      explore: 'Ciel',
      menu: 'Menu',
    },
    sheet: {
      home: {
        eyebrow: 'Ton vrai signe',
        ctaCalculate: 'Calcule ton vrai signe',
        hint:
          'Entre ta date, ton heure et ton lieu de naissance pour découvrir ton vrai signe.',
      },
      display: {
        eyebrow: 'Afficher',
        labels: { label: 'Noms et lignes' },
        zones: { label: 'Zones des signes' },
        guides: { label: 'Repères du ciel' },
        relics: { label: 'Satellites historiques' },
      },
      navigation: {
        eyebrow: 'Caméra',
        sun: { label: 'Soleil' },
        moon: { label: 'Lune' },
        earth: { label: 'Terre' },
      },
    },
    bottomSheet: {
      defaultAriaLabel: 'Panneau',
      collapseAriaLabel: 'Replier le panneau',
      expandAriaLabel: 'Étendre le panneau',
      openAriaLabel: 'Ouvrir le panneau',
      closeAriaLabel: 'Fermer le panneau',
    },
  },

  panels: {
    body: {
      closeStar: 'Fermer le panneau étoile',
      closeSun: 'Fermer le panneau Soleil',
      closeMoon: 'Fermer le panneau Lune',
      closeNamed: (name: string): string => `Fermer le panneau ${name}`,
    },
    legend: { closeAriaLabel: 'Fermer la légende' },
    explore: { closeAriaLabel: 'Fermer la fenêtre En savoir plus' },
  },

  keyboardShortcuts: {
    sectionLabel: 'Raccourcis clavier',
    chipLabel: 'Raccourcis clavier',
    chipAriaLabel: 'Afficher les raccourcis clavier',
    rows: [
      { keys: '← → ↑ ↓', desc: 'Orbiter autour de la Terre' },
      { keys: 'A / E', desc: 'Tourner la caméra en place' },
      { keys: 'Z / S', desc: 'Zoomer / dézoomer' },
      { keys: '+ / − / Page ↑↓', desc: 'Zoom (alternatives)' },
    ],
    sideViewNote:
      'En Vue de côté : les flèches font panner la caméra, A/E sont désactivées.',
  },

  sidebar: {
    expandTooltip: 'Agrandir le panneau',
    collapseTooltip: 'Réduire le panneau',
    expandAriaLabel: 'Agrandir le panneau',
    collapseAriaLabel: 'Réduire le panneau',
    cameraSectionLabel: 'Caméra',
    cameraSectionAriaLabel: 'Caméra : destinations rapides',
    layersSectionLabel: 'Calques',
    layersSectionAriaLabel: 'Calques d’affichage',
    cameraDestinations: {
      sun: {
        label: 'Soleil',
        tooltip: 'Centrer sur le Soleil',
        ariaLabel: 'Centrer la caméra sur le Soleil',
      },
      moon: {
        label: 'Lune',
        tooltip: 'Centrer sur la Lune',
        ariaLabel: 'Centrer la caméra sur la Lune',
      },
      earth: {
        label: 'Terre',
        tooltip: 'Revenir à la Terre',
        ariaLabel: 'Revenir à la vue orbitale par défaut',
      },
    },
    layers: {
      labels: 'Noms',
      zones: 'Zones des signes',
      zonesLocked: 'Les zones des signes apparaissent sur la carte une fois ton signe calculé.',
      guides: 'Repères',
      relics: 'Satellites',
    },
    exploreSectionLabel: 'Explorer le ciel',
    result: {
      eyebrow: 'Ton vrai signe',
      why: 'Tout mon thème →',
      share: 'Partager mon signe',
      shareCopied: 'Lien copié !',
    },
  },

  systemDock: {
    sectionAriaLabel: 'Système',
    explore: {
      short: 'Liens',
      tooltip: 'Ressources externes : cartes du ciel, éphémérides…',
      ariaLabel: 'Ouvrir la liste de liens utiles',
    },
    legend: {
      short: 'Légende',
      tooltip: 'Légende : symboles, couleurs, calques',
      ariaLabel: 'Ouvrir la légende',
    },
    fullscreen: {
      short: 'Plein écran',
      tooltipEnter: 'Passer en plein écran',
      tooltipExit: 'Quitter le plein écran',
    },
    exportView: {
      short: 'Image',
      tooltip: 'Enregistre la vue 3D actuelle dans un fichier image PNG',
      ariaLabel: 'Exporter la vue 3D en image PNG',
    },
    exportPdf: {
      short: 'PDF',
      tooltipReady: 'Télécharger le PDF : le ciel + ton vrai signe',
      tooltipGenerating: 'Génération du PDF…',
      tooltipLocked: 'Calcule d’abord un thème natal pour exporter le PDF',
      ariaLabel: 'Télécharger le PDF du ciel et de ton vrai signe',
    },
  },

  bodyInfo: {
    horoscopeRow: 'Horoscope',
    star: {
      eyebrowPrefix: 'Étoile',
      footer:
        'Bascule sur l’axe pour voir le dessin se disloquer : depuis la Terre, les étoiles semblent alignées ; vues de côté, elles sont séparées par des centaines d’années-lumière.',
      rows: { distance: 'Distance', magnitude: 'Éclat (magnitude)', depth: 'Profondeur' },
      modeToggleLabel: 'Vue de côté',
      closestSelf: 'étoile la plus proche du dessin',
      ratioFarther: (ratio: string, closest: string, distance: string): string =>
        `${ratio}× plus loin que ${closest} (${distance})`,
    },
    sun: {
      eyebrow: 'Étoile',
      footer:
        'L’étoile la plus proche : 8 minutes-lumière. Sa lumière éclaire le ciel diurne et masque toutes les autres.',
      rows: {
        constellation: 'Constellation (vrai ciel)',
        distance: 'Distance',
        raDec: 'Coordonnées célestes',
        magnitude: 'Éclat (magnitude)',
      },
      magnitudeValue: '−26,7',
    },
    moon: {
      eyebrow: 'Satellite naturel',
      rows: {
        constellation: 'Constellation (vrai ciel)',
        distance: 'Distance',
        phase: 'Phase',
        raDec: 'Coordonnées célestes',
      },
    },
    planet: {
      eyebrow: 'Planète',
      rows: {
        constellation: 'Constellation (vrai ciel)',
        distance: 'Distance',
        raDec: 'Coordonnées célestes',
      },
    },
    satellite: {
      eyebrow: 'Satellite historique',
      rows: { launch: 'Lancement' },
    },
  },

  exploreSpace: {
    title: 'Continuer à explorer le ciel',
    subtitle:
      'Si la précession et le ciel réel t’intriguent : observatoires, cartes du ciel interactives, éphémérides, vulgarisation. Sources officielles (NASA, ESA, IAU). Les liens s’ouvrent dans un nouvel onglet.',
    closeLabel: 'Fermer',
    closeAriaLabel: 'Fermer',
    footerCredit: 'Conçu par Garance Wetzel',
    githubAriaLabel: 'GitHub de Garance Wetzel',
    emailCopyAriaLabel: (email: string): string => `Copier l’email : ${email}`,
    emailCopiedAriaLabel: (email: string): string => `Email copié : ${email}`,
    emailCopyTitle: (email: string): string => `Copier ${email}`,
    emailCopiedTitle: 'Email copié',
    emailCopiedBadge: 'Copié',
    sections: [
      {
        title: 'NASA',
        links: [
          {
            label: 'Science : système solaire (missions, données)',
            href: 'https://science.nasa.gov/solar-system/',
          },
          {
            label: 'Science : univers (galaxies, trous noirs, cosmologie)',
            href: 'https://science.nasa.gov/universe/',
          },
          { label: 'Image du jour (APOD)', href: 'https://apod.nasa.gov/apod/astropix.html' },
          { label: 'James Webb Space Telescope', href: 'https://webb.nasa.gov/' },
          { label: 'NASA+ : vidéos et directs', href: 'https://plus.nasa.gov/' },
        ],
      },
      {
        title: 'ESA & partenaires',
        links: [
          {
            label: 'ESA : exploration scientifique',
            href: 'https://www.esa.int/Science_Exploration/Space_Science',
          },
          {
            label: 'Gaia : carte de milliards d’étoiles',
            href: 'https://www.cosmos.esa.int/web/gaia',
          },
          { label: 'Hubble / observations', href: 'https://esahubble.org/' },
        ],
      },
      {
        title: 'Cartes du ciel & éphémérides',
        links: [
          { label: 'Stellarium Web : ciel interactif', href: 'https://stellarium-web.org/' },
          {
            label: 'TheSkyLive : positions planètes et comètes',
            href: 'https://theskylive.com/',
          },
          {
            label: 'Heavens-Above : passages ISS et satellites',
            href: 'https://www.heavens-above.com/',
          },
        ],
      },
      {
        title: 'Données & pédagogie',
        links: [
          { label: 'JPL Horizons : éphémérides précises', href: 'https://ssd.jpl.nasa.gov/horizons/' },
          {
            label: 'NASA SpacePlace : vulgarisation jeunes publics',
            href: 'https://spaceplace.nasa.gov/',
          },
          { label: 'IAU : astronomie et nomenclature', href: 'https://www.iau.org/' },
        ],
      },
    ],
  },

  legend: {
    title: 'Légende',
    subtitle: 'Symboles, couleurs, calques',
    sections: {
      bodies: 'Astres',
      zones: 'Zones des signes',
      guides: 'Repères du ciel',
      relics: 'Satellites historiques',
    },
    zoneLabels: {
      yours: 'Ton signe : sa zone officielle (IAU)',
      others: 'Les autres signes',
      sun: 'Position du Soleil',
    },
    guideLabels: {
      axis: 'Axe terrestre (rotation)',
      equator: 'Équateur céleste',
      ecliptic: 'Écliptique (chemin du Soleil)',
    },
    bodyLabels: { sun: 'Soleil', moon: 'Lune' },
    toggleVisible: 'visible',
    toggleHidden: 'masqué',
  },

  sky: {
    zonePrefix: 'Zone',
    loading: 'Chargement du ciel…',
    key: {
      ariaLabel: 'Légende de la carte',
      zone: 'Zone officielle de ton signe (UAI)',
      boundary: 'Frontière entre deux constellations',
      figure: 'Figure : les étoiles reliées',
      earth: 'La Terre, ton point de vue',
    },
  },

  distanceFromEarth: (d: string): string => `à ${d} de la Terre`,

  hudFrame: {
    modeNatal: 'Ton ciel',
    // Keep in sync with #seo-splash in index.html (crawlers, mobile).
    liveQuestion: 'Quel est ton vrai signe astronomique ?',
    todayDiffer: (horoscope: string, sky: string): string =>
      `Aujourd’hui, l’horoscope dit **${horoscope}**. Le ciel dit **${sky}**.`,
    todaySame: (sky: string): string =>
      `Aujourd’hui, le Soleil est devant **${sky}** : pour une fois, l’horoscope a raison.`,
    why: 'Pourquoi ?',
    summaryAriaLabel: (mode: string, main: string): string =>
      `Voir mon vrai signe : ${mode}, ${main}`,
  },

  installPwa: {
    ariaLabel: 'Installer l’application',
    dismissAriaLabel: 'Plus tard',
    android: {
      title: 'Installer l’app',
      body: 'Ajoute Signe astronomique à ton écran d’accueil pour un accès en un tap.',
      cta: 'Installer',
    },
    ios: {
      title: 'Ajouter à l’écran d’accueil',
      body: 'Appuie sur Partager ↑ puis « Sur l’écran d’accueil » pour installer l’app.',
    },
  },

  bodies: {
    sun: 'Soleil',
    moon: 'Lune',
  },

  moonPhases: {
    new: 'Nouvelle',
    waxingCrescent: 'Premier croissant',
    firstQuarter: 'Premier quartier',
    waxingGibbous: 'Gibbeuse croissante',
    full: 'Pleine',
    waningGibbous: 'Gibbeuse décroissante',
    lastQuarter: 'Dernier quartier',
    waningCrescent: 'Dernier croissant',
  },

  /** IETF locale for `Intl` formatters and the `<html lang>` attribute. */
  intlLocale: 'fr-FR',
};

export type Copy = typeof fr;
