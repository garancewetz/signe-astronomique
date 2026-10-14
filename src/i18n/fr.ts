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
    brand: 'Signe astronomique',
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
    title: 'Quand es-tu né·e ?',
    dateLabel: 'Date de naissance',
    timeLabel: 'Heure de naissance',
    placeLabel: 'Lieu de naissance',
    detailsToggle: 'Ajouter l’heure et le lieu',
    detailsHint: 'Facultatif, pour plus de précision. Sans eux, on calcule à midi.',
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
    eyebrow: 'TON VRAI SIGNE',
    closeAriaLabel: 'Fermer',
    horoscopeSays: 'Ton horoscope dit',
    skySays: 'Le vrai ciel dit',
    whatTitle: 'C’est quoi, ton signe ?',
    whyTitle: 'Et ton horoscope ?',
    alignmentBody: (sign: string): string =>
      `Le jour de ta naissance, vu depuis la Terre, le Soleil était devant la constellation **${sign}**. Ton signe, c’est simplement ça : la constellation derrière le Soleil.`,
    alignmentAriaLabel: (sign: string): string =>
      `Schéma : la Terre, le Soleil et la constellation ${sign} sont alignés.`,
    sun: 'Soleil',
    earth: 'Terre',
    sameTitle: 'Horoscope et ciel sont d’accord',
    sameBody: (date: string, sign: string): string =>
      `Les dates des horoscopes ont été fixées il y a 2\u202f000\u00a0ans et le ciel a glissé d’environ un mois depuis. Coup de chance : le ${date} tombe dans la période où les deux disent **${sign}**.`,
    differBody: (date: string, horoscope: string, sky: string): string =>
      `Les dates des horoscopes ont été fixées il y a 2\u202f000\u00a0ans. Depuis, l’axe de la Terre a lentement pivoté (la précession) et le ciel a glissé d’environ un mois : le ${date}, le Soleil n’est plus devant ${horoscope}, mais devant **${sky}**.`,
    ophiuchus:
      '**Ophiuchus** est le 13ᵉ signe oublié : le Soleil le traverse chaque année, mais les horoscopes n’en ont gardé que 12.',
    revealCta: (sign: string): string => `Voir ${sign} dans le ciel`,
    allSignsLink: 'Les vraies dates des 13 signes',
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
    systemDrawer: {
      ariaLabel: 'Menu système',
      backdropAriaLabel: 'Fermer le menu système',
      openAriaLabel: 'Ouvrir le menu système',
      legend: { label: 'Légende', sublabel: 'Symboles · couleurs · calques' },
      explore: { label: 'Liens utiles', sublabel: 'Cartes du ciel · éphémérides' },
      allSigns: { label: 'Tous les signes', sublabel: 'Les vraies dates des 13 signes' },
      share: {
        label: 'Partager mon signe',
        sublabelReady: 'Lien direct — SMS, WhatsApp, mail…',
        sublabelCopied: 'Lien copié dans le presse-papier !',
        sublabelLocked: 'Calcule d’abord ton ciel',
      },
      exportView: { label: 'Exporter la vue', sublabel: 'PNG du ciel 3D' },
      exportReport: {
        label: 'Exporter le rapport',
        sublabelReady: 'PDF — le ciel + ton vrai signe',
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
      coords: 'Ma naissance',
      analysis: 'Mon signe',
      explore: 'Explorer',
    },
    sheet: {
      home: {
        eyebrow: 'Console',
        ctaCalculate: 'Calcule ton vrai signe',
        hint:
          'Entre ta date, ton heure et ton lieu de naissance pour découvrir ton vrai signe.',
      },
      display: {
        eyebrow: 'Afficher',
        labels: { label: 'Noms et lignes', sublabel: 'Astres · constellations' },
        guides: { label: 'Repères du ciel', sublabel: 'Axe · équateur · écliptique' },
        relics: { label: 'Reliques orbitales', sublabel: 'Satellites historiques' },
      },
      navigation: {
        eyebrow: 'Caméra',
        sun: { label: 'Soleil' },
        moon: { label: 'Lune' },
        earth: { label: 'Terre' },
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
      relics: 'Reliques',
    },
    exploreSectionLabel: 'Explorer le ciel',
    result: {
      eyebrow: 'Ton vrai signe',
      why: 'Pourquoi ? →',
      share: 'Partager mon signe',
      shareCopied: 'Lien copié !',
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
    exportView: {
      tooltip: 'Enregistre la vue 3D actuelle dans un fichier image PNG',
      ariaLabel: 'Exporter la vue 3D en image PNG',
    },
    exportPdf: {
      tooltipReady: 'Télécharger le PDF : le ciel + ton vrai signe',
      tooltipGenerating: 'Génération du PDF…',
      tooltipLocked: 'Calcule d’abord un thème natal pour exporter le PDF',
      ariaLabel: 'Télécharger le PDF du ciel et de ton vrai signe',
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

  legend: {
    title: 'LÉGENDE',
    subtitle: 'SYMBOLES · COULEURS · CALQUES',
    sections: {
      bodies: 'ASTRES',
      guides: 'REPÈRES DU CIEL',
      relics: 'RELIQUES ORBITALES',
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

  hudFrame: {
    modeNatal: 'CIEL NATAL',
    modeLive: 'CIEL EN DIRECT',
    summaryAriaLabel: (mode: string, main: string): string =>
      `Voir mon vrai signe — ${mode} · ${main}`,
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
