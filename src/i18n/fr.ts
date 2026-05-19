/**
 * Centralised French UI copy. The project is FR-only today, so there is no
 * runtime locale switching — this module exists to give translation a single
 * surface to swap and to prevent typo/drift across the codebase.
 *
 * Convention:
 *   - Keys are in English, content is French.
 *   - Strings that are derived from data (constellation names, planet labels,
 *     mission-log row labels) stay near the data — only standalone UI copy
 *     lives here.
 *   - Functions, not template strings, are used when interpolation is needed.
 */

export const fr = {
  cockpit: {
    sidebarLabel: 'Console de pilotage',
    skipToMain: 'Aller au contenu principal',
  },

  errorBoundary: {
    fullscreenTitle: 'Le cockpit a perdu le signal.',
    fullscreenDescription:
      'Une erreur inattendue est survenue. Recharge la page pour relancer la console — tes données ne sont pas enregistrées, rien n’est perdu côté serveur.',
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

  cityAutocomplete: {
    errorRateLimit: 'Trop de requêtes. Réessaie dans un instant.',
    errorService: 'Service de recherche indisponible.',
    errorNetwork: 'Connexion impossible. Vérifie ta connexion réseau.',
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
    },
  },

  panels: {
    body: {
      closeStar: 'Fermer le panneau étoile',
      closeSun: 'Fermer le panneau Soleil',
      closeMoon: 'Fermer le panneau Lune',
    },
    legend: { closeAriaLabel: 'Fermer la légende' },
    explore: { closeAriaLabel: 'Fermer la fenêtre En savoir plus' },
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
  },
} as const;

export type FrenchCopy = typeof fr;
