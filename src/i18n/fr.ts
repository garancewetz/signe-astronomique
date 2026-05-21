/**
 * Centralised French UI copy. The English mirror lives in en.ts — keys
 * must stay in sync. The LocaleContext picks the active dictionary at
 * runtime; components consume it via `useT()`.
 *
 * Convention:
 *   - Keys are in English, content is French.
 *   - Functions, not template strings, are used when interpolation is needed.
 *   - Data-derived strings (constellation/planet/satellite names) live next to
 *     the data, but their EN counterpart is wired in the same way.
 */

export const fr = {
  cockpit: {
    sidebarLabel: 'Console de pilotage',
    skipToMain: 'Aller au contenu principal',
    brand: 'CIEL RÉEL',
    srTitle: 'Carte du ciel réel',
  },

  errorBoundary: {
    fullscreenTitle: 'Le cockpit a perdu le signal.',
    fullscreenDescription:
      'Une erreur inattendue est survenue. Recharge la page pour relancer la console — rien n’est enregistré côté serveur, aucune donnée n’est perdue.',
    inlineTitle: 'Le rendu 3D a décroché.',
    inlineDescription:
      'La vue céleste n’a pas pu démarrer. La console reste utilisable — recharge la page pour réessayer.',
    label: 'ERREUR',
    reload: 'Recharger la page',
    retry: 'Réessayer',
  },

  natalForm: {
    ariaLabel: 'Coordonnées de naissance',
    todayLabel: 'Aujourd’hui',
    todayAriaLabel: 'Aujourd’hui — calcule le ciel actuel',
    dateLabel: 'DATE',
    timeLabel: 'HEURE',
    placeLabel: 'LIEU DE NAISSANCE',
    placePlaceholder: 'Ville de naissance…',
    submitIdle: 'CALCULER MON SIGNE',
    submitBusy: 'Calcul du ciel…',
  },

  searchHistory: {
    sectionLabel: 'Récents',
    listAriaLabel: 'Historique des recherches récentes',
    restoreAriaLabel: (date: string, place: string): string =>
      `Recalculer le ${date} à ${place}`,
    removeAriaLabel: (date: string, place: string): string =>
      `Retirer ${date} à ${place} de l’historique`,
  },

  cityAutocomplete: {
    errorRateLimit: 'Trop de requêtes. Réessaie dans un instant.',
    errorService: 'Service de recherche indisponible.',
    errorNetwork: 'Connexion impossible. Vérifie ton réseau.',
    /** IETF language for the Nominatim accept-language header. */
    nominatimLang: 'fr',
  },

  orbital: {
    errorBody:
      'Connexion à Celestrak impossible — la population orbitale est indisponible.',
    retryLabel: 'Réessayer',
    retryAriaLabel: 'Réessayer le chargement de la population orbitale',
  },

  analysis: {
    sectionLabel: 'RAPPORT',
    title: 'ANALYSE',
    tablistAriaLabel: 'Sections de l’analyse',
    closeAriaLabel: 'Fermer l’analyse',
    tabs: {
      resume: { label: 'Mon signe', sublabel: 'Ton ciel de naissance' },
      carte: { label: 'Carte', sublabel: 'Roue des constellations' },
      lecture: { label: 'Lecture', sublabel: 'Comprendre ta carte' },
      donnees: { label: 'Données', sublabel: 'Astronomie brute' },
    },
    /** Used by ReportPanelShell when each panel is opened individually. */
    panelTitles: {
      resume: 'MON SIGNE',
      carte: 'CARTE',
      lecture: 'LECTURE',
      donnees: 'DONNÉES',
    },
    panelSubtitles: {
      resume: 'TON CIEL DE NAISSANCE',
      carte: 'ROUE DES CONSTELLATIONS',
      lecture: 'COMPRENDRE TA CARTE',
      donnees: 'ASTRONOMIE BRUTE',
    },
    panelCloseAriaLabel: (title: string): string =>
      `Fermer le panneau ${title.toLowerCase()}`,
  },

  analysisCta: {
    openAriaLabel: 'Ouvrir l’analyse',
    lockedAriaLabel: 'Analyse — verrouillé · saisis tes coordonnées',
    tooltipReady: 'Analyse',
    tooltipLocked: 'Analyse · verrouillé',
    label: 'Analyse',
  },

  mobile: {
    coordinatesModal: {
      ariaLabel: 'Mes coordonnées de naissance',
      sectionLabel: 'Console',
      title: 'Mes coordonnées',
      closeAriaLabel: 'Fermer',
      editAriaLabel: 'Modifier mes coordonnées de naissance',
    },
    systemDrawer: {
      ariaLabel: 'Menu système',
      backdropAriaLabel: 'Fermer le menu système',
      openAriaLabel: 'Ouvrir le menu système',
      legend: { label: 'Légende', sublabel: 'Symboles · couleurs · calques' },
      explore: { label: 'Liens utiles', sublabel: 'Cartes du ciel · éphémérides' },
      share: {
        label: 'Offrir ce ciel',
        sublabelReady: 'Lien direct — SMS, WhatsApp, mail…',
        sublabelCopied: 'Lien copié dans le presse-papier !',
        sublabelLocked: 'Calcule d’abord ton ciel',
      },
      exportView: { label: 'Exporter la vue', sublabel: 'PNG du ciel 3D' },
      exportReport: {
        label: 'Exporter le rapport',
        sublabelReady: 'PDF A4 — vue + carte complète',
        sublabelLocked: 'Calcule d’abord ton ciel',
      },
      language: { label: 'Langue', sublabel: 'Français · English' },
    },
    cockpit: {
      mainAriaLabel: 'Console mobile',
      navAriaLabel: 'Sections de la console mobile',
    },
    legend: { ariaLabel: 'Légende' },
    tabs: {
      display: 'Affichage',
      navigation: 'Navigation',
      analysis: 'Analyse',
    },
    sheet: {
      home: {
        eyebrow: 'Console',
        ctaCalculate: 'CALCULER MON SIGNE',
        hint:
          'Choisis une section dans la barre du bas — affichage, navigation, ou analyse une fois ton ciel calculé.',
      },
      display: {
        eyebrow: 'Affichage',
        labels: { label: 'Noms et lignes', sublabel: 'Astres · constellations' },
        guides: { label: 'Repères du ciel', sublabel: 'Axe · équateur · écliptique' },
        orbital: {
          label: 'Population orbitale',
          sublabelUnavailable: 'Indisponible pour cette date',
          sublabelLoading: 'Chargement Celestrak…',
          sublabelError: 'Réessayer',
          sublabelLive: 'Temps réel · Celestrak',
        },
        relics: { label: 'Reliques orbitales', sublabel: 'Satellites historiques' },
        sideView: {
          label: 'Perspective axiale',
          sublabelReady: 'Vue de côté · constellation',
          sublabelLocked: 'Sélectionne une étoile',
        },
      },
      navigation: {
        eyebrow: 'Navigation',
        sun: { label: 'Soleil', sublabel: 'Centrer la caméra' },
        moon: { label: 'Lune', sublabel: 'Centrer la caméra' },
        earth: { label: 'Terre', sublabel: 'Vue orbitale par défaut' },
      },
      analysis: {
        eyebrow: 'Analyse',
        resume: { label: 'Mon signe', sublabel: 'Ton ciel de naissance' },
        carte: { label: 'Carte', sublabel: 'Roue des constellations' },
        lecture: { label: 'Lecture', sublabel: 'Comprendre ta carte' },
        donnees: { label: 'Données', sublabel: 'Astronomie brute' },
      },
    },
    bottomSheet: {
      defaultAriaLabel: 'Console',
      collapseAriaLabel: 'Replier la console',
      expandAriaLabel: 'Étendre la console',
      openAriaLabel: 'Ouvrir la console',
      closeAriaLabel: 'Fermer la console',
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
    chipLabel: 'Clavier',
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

  radarWheel: {
    emptyTitle: 'Roue zodiacale astronomique vide.',
    emptyDescription:
      'Roue radar des 13 constellations IAU, en attente d’un thème natal calculé.',
    title: (sunName: string): string =>
      `Roue zodiacale astronomique — Soleil dans ${sunName}.`,
    description: (args: {
      dateLabel: string;
      place: string;
      sunName: string;
      ascendantDeg: number;
    }): string =>
      `Position du Soleil, de la Lune et des planètes le ${args.dateLabel}${args.place ? `, ${args.place}` : ''}, ` +
      `projetée sur les 13 constellations IAU. Constellation solaire : ${args.sunName}. ` +
      `Ascendant à ${args.ascendantDeg.toFixed(1)}° de longitude écliptique.`,
    asc: 'ASC',
    centerLabel: 'TC ÉCLIPTIQUE J2000',
    localSuffix: 'LOCAL',
    utcSuffix: 'UTC',
  },

  sidebar: {
    expandTooltip: 'Étendre la console',
    collapseTooltip: 'Réduire la console',
    expandAriaLabel: 'Étendre la console',
    collapseAriaLabel: 'Réduire la console',
    cameraSectionLabel: 'Caméra',
    cameraSectionAriaLabel: 'Caméra — destinations rapides',
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
      guides: 'Repères',
      orbital: 'Orbital',
      orbitalAria: {
        loading: 'Population orbitale — chargement Celestrak…',
        error: 'Population orbitale — réessayer',
        live: 'Population orbitale (temps réel)',
        unavailable: 'Population orbitale — indisponible pour cette date',
      },
      relics: 'Reliques',
      sideView: 'Vue de côté',
      sideViewLocked: 'Vue de côté · sélectionne une étoile',
    },
  },

  systemDock: {
    sectionAriaLabel: 'Système',
    explore: {
      tooltip: 'Ressources externes : cartes du ciel, éphémérides…',
      ariaLabel: 'Ouvrir la liste de liens utiles',
    },
    legend: {
      tooltip: 'Légende — symboles, couleurs, calques',
      ariaLabel: 'Ouvrir la légende',
    },
    fullscreen: {
      tooltipEnter: 'Passer en plein écran',
      tooltipExit: 'Quitter le plein écran',
    },
    share: {
      tooltipReady: 'Offrir ce ciel — lien direct',
      tooltipCopied: 'Lien copié !',
      tooltipLocked: 'Calcule d’abord ton ciel pour l’offrir',
      ariaLabel: 'Offrir le lien vers ce ciel',
    },
    exportView: {
      tooltip: 'Enregistre la vue 3D actuelle dans un fichier image PNG',
      ariaLabel: 'Exporter la vue 3D en image PNG',
    },
    exportPdf: {
      tooltipReady: 'Exporter la vue 3D et le rapport complet en PDF A4',
      tooltipGenerating: 'Génération du PDF…',
      tooltipLocked: 'Calcule d’abord un thème natal pour exporter le PDF',
      ariaLabel: 'Exporter la vue 3D et le rapport complet en PDF',
    },
  },

  bodyInfo: {
    star: {
      eyebrowPrefix: 'ÉTOILE',
      footer:
        'Bascule sur l’axe pour voir le dessin se disloquer : depuis la Terre, les étoiles semblent alignées ; vues de côté, elles sont séparées par des centaines d’années-lumière.',
      rows: { distance: 'DISTANCE', magnitude: 'MAGNITUDE', depth: 'PROFONDEUR' },
      modeToggleLabel: 'PERSPECTIVE AXIALE',
      closestSelf: 'étoile la plus proche du dessin',
      ratioFarther: (ratio: string, closest: string, distance: string): string =>
        `${ratio}× plus loin que ${closest} (${distance})`,
    },
    sun: {
      eyebrow: 'ÉTOILE HÔTE',
      footer:
        'L’étoile la plus proche : 8 minutes-lumière. Sa lumière éclaire le ciel diurne et masque toutes les autres.',
      rows: {
        constellation: 'CONSTELLATION',
        distance: 'DISTANCE',
        raDec: 'RA / DEC',
        magnitude: 'MAGNITUDE',
      },
      magnitudeValue: '−26,7',
    },
    moon: {
      eyebrow: 'SATELLITE NATUREL',
      rows: {
        constellation: 'CONSTELLATION',
        distance: 'DISTANCE',
        phase: 'PHASE',
        raDec: 'RA / DEC',
      },
    },
    planet: {
      eyebrow: 'PLANÈTE',
      rows: {
        constellation: 'CONSTELLATION',
        distance: 'DISTANCE',
        raDec: 'RA / DEC',
      },
    },
    satellite: {
      eyebrow: 'RELIQUE ORBITALE',
      rows: { launch: 'LANCEMENT' },
    },
  },

  exploreSpace: {
    title: 'CONTINUER À EXPLORER LE CIEL',
    subtitle:
      'Si la précession et le ciel réel t’intriguent : observatoires, cartes du ciel interactives, éphémérides, vulgarisation. Sources officielles (NASA, ESA, IAU). Les liens s’ouvrent dans un nouvel onglet.',
    closeLabel: 'FERMER',
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
            label: 'Science — système solaire (missions, données)',
            href: 'https://science.nasa.gov/solar-system/',
          },
          {
            label: 'Science — univers (galaxies, trous noirs, cosmologie)',
            href: 'https://science.nasa.gov/universe/',
          },
          { label: 'Image du jour (APOD)', href: 'https://apod.nasa.gov/apod/astropix.html' },
          { label: 'James Webb Space Telescope', href: 'https://webb.nasa.gov/' },
          { label: 'NASA+ — vidéos et directs', href: 'https://plus.nasa.gov/' },
        ],
      },
      {
        title: 'ESA & partenaires',
        links: [
          {
            label: 'ESA — exploration scientifique',
            href: 'https://www.esa.int/Science_Exploration/Space_Science',
          },
          {
            label: 'Gaia — carte de milliards d’étoiles',
            href: 'https://www.cosmos.esa.int/web/gaia',
          },
          { label: 'Hubble / observations', href: 'https://esahubble.org/' },
        ],
      },
      {
        title: 'Cartes du ciel & éphémérides',
        links: [
          { label: 'Stellarium Web — ciel interactif', href: 'https://stellarium-web.org/' },
          {
            label: 'TheSkyLive — positions planètes et comètes',
            href: 'https://theskylive.com/',
          },
          {
            label: 'Heavens-Above — passages ISS et satellites',
            href: 'https://www.heavens-above.com/',
          },
        ],
      },
      {
        title: 'Données & pédagogie',
        links: [
          { label: 'JPL Horizons — éphémérides précises', href: 'https://ssd.jpl.nasa.gov/horizons/' },
          {
            label: 'NASA SpacePlace — vulgarisation jeunes publics',
            href: 'https://spaceplace.nasa.gov/',
          },
          { label: 'IAU — astronomie et nomenclature', href: 'https://www.iau.org/' },
        ],
      },
    ],
  },

  resumeBody: {
    toggleLabelsHide: 'Masquer les constellations',
    toggleLabelsShow: 'Voir les constellations',
  },

  birthHeader: {
    eyebrow: 'THÈME ASTRAL · CIEL RÉEL À LA NAISSANCE',
    placeLabelFallback: 'Ciel natal',
    north: 'N',
    south: 'S',
    east: 'E',
    west: 'O',
  },

  resumeCard: {
    sectionLabel: 'TON CIEL EN UN COUP D’ŒIL',
    rows: {
      trueSign: 'Vrai signe (Soleil)',
      moon: 'Lune',
      ascendant: 'Ascendant',
      seasonMoment: 'Saison · moment',
    },
    revealAriaLabel: 'Voir cette constellation dans le ciel',
    revealTooltip: 'Voir cette constellation dans le ciel',
  },

  seasons: {
    spring: 'Printemps',
    summer: 'Été',
    autumn: 'Automne',
    winter: 'Hiver',
  },

  timeOfDay: {
    morning: 'matin',
    afternoon: 'après-midi',
    evening: 'soirée',
    night: 'nuit',
  },

  ascendantCard: {
    sectionLabel: '↑ ASCENDANT · HORIZON EST',
    lstLabel: 'TS',
  },

  howToRead: {
    sectionLabel: 'COMMENT LIRE TA CARTE DU CIEL',
    intro:
      'Ce que tu vois est le **ciel réel** tel qu’il était au-dessus du lieu, à la date et à l’heure de ta naissance — pas un schéma symbolique.',
    layersHintPrefix: 'Active le calque ',
    layersHintEmphasis: 'Repères',
    layersHintSuffix:
      ' dans la barre latérale pour voir l’axe de rotation de la Terre, l’équateur céleste (sa projection sur la voûte) et l’écliptique — la trajectoire apparente du Soleil au fil de l’année. Les treize constellations zodiacales sont celles que ce chemin traverse.',
    boundaries:
      'Les frontières dessinées sont celles fixées par l’IAU en 1930 (E. Delporte), tracées d’après la position des étoiles. Elles ne forment pas douze cases égales : le Soleil reste 45 jours dans la Vierge, 19 dans Ophiuchus, et seulement 6 dans le Scorpion. C’est cette géométrie réelle que le calendrier astrologique a lissée en douze parts de 30°.',
  },

  twoMotions: {
    sectionLabel: 'DEUX MOUVEMENTS, DEUX SIGNES',
    solar: {
      lead: 'Ton ',
      leadEmphasis: 'signe solaire',
      mid: ' dépend de la position du Soleil dans le zodiaque. Le Soleil met ',
      midEmphasis: '~365 jours',
      mid2: ' à parcourir l’écliptique ; le calendrier astrologique la découpe en ',
      mid2Emphasis: '12 secteurs de 30°',
      tail:
        ', soit environ 30 jours chacun. C’est pour ça qu’une simple date suffit à le déterminer.',
    },
    ascendant: {
      lead: 'Ton ',
      leadEmphasis: 'ascendant',
      mid: ', lui, est le signe qui pointait juste au-dessus de l’horizon est à l’instant précis de ta naissance. Or la Terre fait un tour sur elle-même en ',
      midEmphasis: '24 h',
      mid2: ' : les 360° du zodiaque défilent à l’horizon en une journée, soit un nouveau signe toutes les ',
      mid2Emphasis: '~2 h',
      tail: '.',
    },
    summary: {
      lead: 'D’où la dissymétrie : la ',
      leadEmphasis: 'révolution annuelle',
      mid: ' de la Terre autour du Soleil règle le signe solaire ; sa ',
      midEmphasis: 'rotation quotidienne',
      tail:
        ' règle l’ascendant. C’est aussi pour ça que le lieu de naissance compte : l’horizon est dépend de la latitude et de la longitude.',
    },
  },

  planetTable: {
    sectionLabel: 'POSITIONS DES PLANÈTES · MAISONS',
    columns: { body: 'ASTRE', constellation: 'CONSTELLATION', degree: 'DEG', house: 'MAISON' },
    footnote: 'Maisons égales (approx.)',
  },

  astroInfoCard: {
    sectionLabel: 'DONNÉES ASTRONOMIQUES BRUTES',
    rows: {
      lst: 'Heure sidérale locale',
      julianDay: 'Jour julien',
      obliquity: 'Obliquité de l’écliptique',
      precessionGap: 'Décalage précession',
    },
    daysUnit: 'j',
  },

  notesCard: {
    sectionLabel: 'TON SIGNE : ASTROLOGIQUE vs ASTRONOMIQUE',
    tropicalIntroLead: 'Le calendrier astrologique te place sous le signe ',
    tropicalIntroTail:
      ' — une case de 30° découpée à partir du point vernal il y a 2 000 ans.',
    realityLead: 'À cette même date, le Soleil se trouvait en réalité dans la constellation ',
    realityMid: ' : c’est ton vrai signe astronomique. La précession des équinoxes a fait dériver le ciel d’environ ',
    realityTail: ' jours par rapport à l’origine historique du zodiaque.',
    matchedCase:
      'Pour cette date, le secteur du calendrier astrologique et la constellation IAU du Soleil coïncident — un cas rare. Ailleurs sur l’écliptique, la précession les sépare presque toujours d’un signe entier.',
    method:
      'Le calcul s’appuie sur l’astronomie de position : éphémérides de Meeus, frontières IAU/Delporte, repère ICRS J2000. Aucune interprétation symbolique — juste où étaient les astres.',
  },

  scientificFooter: 'ICRS J2000 · MEEUS 1998 · DELPORTE 1930',

  lockedStub: {
    eyebrow: 'Aperçu verrouillé',
    sidebarHint: 'Saisis tes coordonnées dans la barre latérale',
    resume: {
      headline: 'Ton vrai signe, dans le ciel réel',
      taglineLead:
        'Le Soleil n’était presque jamais dans la constellation de ton horoscope. En 2 000 ans, l’axe de la Terre a glissé d’environ une constellation entière — voici ton ciel ',
      taglineEmphasis: 'astronomique exact',
      taglineTail: ', dérive comprise.',
    },
    carte: {
      headline: 'La roue des vraies constellations',
      taglineLead: 'Soleil, Lune et planètes projetés sur les ',
      taglineEmphasis: '13 constellations',
      taglineTail:
        ' qu’ils traversent réellement — frontières fixées par l’Union astronomique internationale (1930), pas les 12 cases égales du zodiaque.',
    },
    lecture: {
      headline: 'Comprendre ta carte',
      taglineSun: 'Soleil',
      taglineSunDesc: ' (ta vraie constellation), la ',
      taglineMoon: 'Lune',
      taglineMoonDesc: ' (sa phase exacte) et l’',
      taglineAscendant: 'ascendant',
      taglineAscendantDesc:
        ' (le point d’horizon est qui se levait à ta naissance) — leur définition astronomique, et comment les repérer dans le ciel.',
      taglineLead: 'Le ',
    },
    donnees: {
      headline: 'Astronomie de position',
      taglineLead: 'Ascension droite, déclinaison, temps sidéral, obliquité de l’écliptique : les ',
      taglineEmphasis: 'coordonnées brutes',
      taglineTail:
        ' du ciel à ta naissance — l’équivalent céleste de la latitude et de la longitude (Meeus 1998 · JPL · IAU 1930).',
    },
  },

  relicsOracle: {
    sectionLabel: 'ORACLE · RELIQUES ORBITALES',
    silencePoetic:
      '« En cette année, l’orbite de la Terre n’appartenait qu’au silence. »',
    silenceExplanation: (year: number): string =>
      `Aucun objet humain n’avait encore quitté l’atmosphère — le premier, Sputnik 1, ne serait lancé qu’en ${year}.`,
    activeIntro:
      'Au moment de ta naissance, ces objets humains tournaient (ou avaient déjà tourné) autour de la Terre :',
  },

  legend: {
    title: 'LÉGENDE',
    subtitle: 'SYMBOLES · COULEURS · CALQUES',
    sections: {
      bodies: 'ASTRES',
      guides: 'REPÈRES DU CIEL',
      relics: 'RELIQUES ORBITALES',
      orbital: 'POPULATION ORBITALE',
    },
    guideLabels: {
      axis: 'Axe terrestre (rotation)',
      equator: 'Équateur céleste',
      ecliptic: 'Écliptique (chemin du Soleil)',
    },
    bodyLabels: { sun: 'Soleil', moon: 'Lune' },
    orbitalRealTime: 'temps réel',
    toggleVisible: 'visible',
    toggleHidden: 'masqué',
  },

  hudFrame: {
    modeNatal: 'CIEL NATAL',
    modeLive: 'CIEL EN DIRECT',
    placeLabelFallback: 'Ciel natal',
    summaryAriaLabel: (mode: string, main: string): string =>
      `Ouvrir la fiche MON SIGNE — ${mode} · ${main}`,
  },

  languageSwitcher: {
    ariaLabel: 'Choisir la langue',
    tooltip: 'Langue',
    options: { fr: 'Français', en: 'English' },
    shortOptions: { fr: 'FR', en: 'EN' },
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
  htmlLang: 'fr',
};

export type Copy = typeof fr;
