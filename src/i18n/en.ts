/**
 * English UI copy. Keys MUST stay in sync with fr.ts — the COPY type is
 * pinned to the French dictionary's shape, so adding or removing a key
 * surfaces as a TypeScript error here.
 */

import type { Copy } from './fr';

export const en: Copy = {
  cockpit: {
    sidebarLabel: 'Cockpit console',
    skipToMain: 'Skip to main content',
    brand: 'REAL SKY',
    srTitle: 'Real sky map',
  },

  errorBoundary: {
    fullscreenTitle: 'The cockpit lost signal.',
    fullscreenDescription:
      'An unexpected error occurred. Reload the page to relaunch the console — nothing is stored on a server, so no data is lost.',
    inlineTitle: 'The 3D view crashed.',
    inlineDescription:
      'The celestial view couldn’t start. The console is still usable — reload the page to try again.',
    label: 'ERROR',
    reload: 'Reload the page',
    retry: 'Retry',
  },

  natalForm: {
    ariaLabel: 'Birth coordinates',
    dateLabel: 'DATE',
    timeLabel: 'TIME',
    placeLabel: 'BIRTHPLACE',
    placePlaceholder: 'Birth city…',
    submitIdle: 'COMPUTE MY SIGN',
    submitBusy: 'Computing the sky…',
    allSignsLink: 'True dates of the 13 signs',
  },

  searchHistory: {
    sectionLabel: 'Recent',
    listAriaLabel: 'Recent searches history',
    restoreAriaLabel: (date: string, place: string): string =>
      `Recompute ${date} in ${place}`,
    removeAriaLabel: (date: string, place: string): string =>
      `Remove ${date} in ${place} from history`,
  },

  cityAutocomplete: {
    errorRateLimit: 'Too many requests. Try again in a moment.',
    errorService: 'Search service unavailable.',
    errorNetwork: 'Connection failed. Check your network.',
    nominatimLang: 'en',
  },

  signReveal: {
    eyebrow: 'YOUR TRUE SIGN',
    closeAriaLabel: 'Close',
    horoscopeSays: 'Your horoscope says',
    skySays: 'The real sky says',
    whatTitle: 'What is your sign?',
    whyTitle: 'And your horoscope?',
    alignmentBody: (sign: string): string =>
      `On the day you were born, seen from Earth, the Sun was in front of the **${sign}** constellation. That’s all a sign is: the constellation behind the Sun.`,
    alignmentAriaLabel: (sign: string): string =>
      `Diagram: Earth, the Sun and the ${sign} constellation are lined up.`,
    sun: 'Sun',
    earth: 'Earth',
    sameTitle: 'Horoscope and sky agree',
    sameBody: (date: string, sign: string): string =>
      `Horoscope dates were set 2,000\u00a0years ago and the sky has drifted by about a month since. Lucky you: ${date} falls where both still say **${sign}**.`,
    differBody: (date: string, horoscope: string, sky: string): string =>
      `Horoscope dates were set 2,000\u00a0years ago. Since then, Earth’s axis has slowly wobbled (precession) and the sky has drifted by about a month: on ${date}, the Sun is no longer in front of ${horoscope}, but **${sky}**.`,
    ophiuchus:
      '**Ophiuchus** is the forgotten 13th sign: the Sun crosses it every year, but horoscopes only kept 12.',
    revealCta: (sign: string): string => `See ${sign} in the sky`,
    allSignsLink: 'True dates of the 13 signs',
  },

  analysisCta: {
    openAriaLabel: 'See my true sign',
  },

  mobile: {
    coordinatesModal: {
      ariaLabel: 'My birth coordinates',
      sectionLabel: 'Your true sign',
      title: 'Your birth',
      closeAriaLabel: 'Close',
      editAriaLabel: 'Edit my birth coordinates',
    },
    systemDrawer: {
      ariaLabel: 'System menu',
      backdropAriaLabel: 'Close the system menu',
      openAriaLabel: 'Open the system menu',
      legend: { label: 'Legend', sublabel: 'Symbols · colors · layers' },
      explore: { label: 'Useful links', sublabel: 'Sky maps · ephemerides' },
      allSigns: { label: 'All signs', sublabel: 'True dates of the 13 signs' },
      share: {
        label: 'Share my sign',
        sublabelReady: 'Direct link — SMS, WhatsApp, mail…',
        sublabelCopied: 'Link copied to clipboard!',
        sublabelLocked: 'Compute your sky first',
      },
      exportView: { label: 'Export view', sublabel: '3D sky PNG' },
      exportReport: {
        label: 'Export report',
        sublabelReady: 'PDF — the sky + your true sign',
        sublabelLocked: 'Compute your sky first',
      },
      language: { label: 'Language', sublabel: 'Français · English' },
    },
    cockpit: {
      mainAriaLabel: 'Mobile console',
      navAriaLabel: 'Mobile console sections',
    },
    legend: { ariaLabel: 'Legend' },
    tabs: {
      coords: 'My birth',
      analysis: 'My sign',
      explore: 'Explore',
    },
    sheet: {
      home: {
        eyebrow: 'Console',
        ctaCalculate: 'COMPUTE MY SIGN',
        hint:
          'Enter your birth date, time and place to discover your true sign.',
      },
      display: {
        eyebrow: 'Show',
        labels: { label: 'Names and lines', sublabel: 'Bodies · constellations' },
        guides: { label: 'Sky guides', sublabel: 'Axis · equator · ecliptic' },
        relics: { label: 'Orbital relics', sublabel: 'Historic satellites' },
      },
      navigation: {
        eyebrow: 'Camera',
        sun: { label: 'Sun' },
        moon: { label: 'Moon' },
        earth: { label: 'Earth' },
      },
    },
    bottomSheet: {
      defaultAriaLabel: 'Console',
      collapseAriaLabel: 'Collapse the console',
      expandAriaLabel: 'Expand the console',
      openAriaLabel: 'Open the console',
      closeAriaLabel: 'Close the console',
    },
  },

  panels: {
    body: {
      closeStar: 'Close the star panel',
      closeSun: 'Close the Sun panel',
      closeMoon: 'Close the Moon panel',
      closeNamed: (name: string): string => `Close the ${name} panel`,
    },
    legend: { closeAriaLabel: 'Close the legend' },
    explore: { closeAriaLabel: 'Close the Learn more window' },
  },

  keyboardShortcuts: {
    sectionLabel: 'Keyboard shortcuts',
    chipLabel: 'Keyboard',
    chipAriaLabel: 'Show keyboard shortcuts',
    rows: [
      { keys: '← → ↑ ↓', desc: 'Orbit around Earth' },
      { keys: 'A / E', desc: 'Rotate camera in place' },
      { keys: 'Z / S', desc: 'Zoom in / out' },
      { keys: '+ / − / Page ↑↓', desc: 'Zoom (alternatives)' },
    ],
    sideViewNote:
      'In Side view: arrows pan the camera, A/E are disabled.',
  },

  sidebar: {
    expandTooltip: 'Expand the console',
    collapseTooltip: 'Collapse the console',
    expandAriaLabel: 'Expand the console',
    collapseAriaLabel: 'Collapse the console',
    cameraSectionLabel: 'Camera',
    cameraSectionAriaLabel: 'Camera — quick destinations',
    layersSectionLabel: 'Layers',
    layersSectionAriaLabel: 'Display layers',
    cameraDestinations: {
      sun: {
        label: 'Sun',
        tooltip: 'Center on the Sun',
        ariaLabel: 'Center the camera on the Sun',
      },
      moon: {
        label: 'Moon',
        tooltip: 'Center on the Moon',
        ariaLabel: 'Center the camera on the Moon',
      },
      earth: {
        label: 'Earth',
        tooltip: 'Back to Earth',
        ariaLabel: 'Back to the default orbital view',
      },
    },
    layers: {
      labels: 'Names',
      guides: 'Guides',
      relics: 'Relics',
    },
    exploreSectionLabel: 'Explore the sky',
    result: {
      eyebrow: 'Your true sign',
      why: 'Why? →',
      share: 'Share my sign',
      shareCopied: 'Link copied!',
    },
  },

  systemDock: {
    sectionAriaLabel: 'System',
    explore: {
      tooltip: 'External resources: sky maps, ephemerides…',
      ariaLabel: 'Open the useful links list',
    },
    legend: {
      tooltip: 'Legend — symbols, colors, layers',
      ariaLabel: 'Open the legend',
    },
    fullscreen: {
      tooltipEnter: 'Enter fullscreen',
      tooltipExit: 'Exit fullscreen',
    },
    exportView: {
      tooltip: 'Save the current 3D view as a PNG image file',
      ariaLabel: 'Export the 3D view as a PNG image',
    },
    exportPdf: {
      tooltipReady: 'Download the PDF: the sky + your true sign',
      tooltipGenerating: 'Generating PDF…',
      tooltipLocked: 'Compute a natal chart first to export the PDF',
      ariaLabel: 'Download the PDF of the sky and your true sign',
    },
  },

  bodyInfo: {
    star: {
      eyebrowPrefix: 'STAR',
      footer:
        'Switch to the axial view to see the figure come apart: from Earth, the stars look aligned; seen from the side, they’re separated by hundreds of light-years.',
      rows: { distance: 'DISTANCE', magnitude: 'MAGNITUDE', depth: 'DEPTH' },
      modeToggleLabel: 'AXIAL PERSPECTIVE',
      closestSelf: 'closest star in this pattern',
      ratioFarther: (ratio: string, closest: string, distance: string): string =>
        `${ratio}× farther than ${closest} (${distance})`,
    },
    sun: {
      eyebrow: 'HOST STAR',
      footer:
        'The closest star: 8 light-minutes away. Its light fills the daytime sky and outshines all the others.',
      rows: {
        constellation: 'CONSTELLATION',
        distance: 'DISTANCE',
        raDec: 'RA / DEC',
        magnitude: 'MAGNITUDE',
      },
      magnitudeValue: '−26.7',
    },
    moon: {
      eyebrow: 'NATURAL SATELLITE',
      rows: {
        constellation: 'CONSTELLATION',
        distance: 'DISTANCE',
        phase: 'PHASE',
        raDec: 'RA / DEC',
      },
    },
    planet: {
      eyebrow: 'PLANET',
      rows: {
        constellation: 'CONSTELLATION',
        distance: 'DISTANCE',
        raDec: 'RA / DEC',
      },
    },
    satellite: {
      eyebrow: 'ORBITAL RELIC',
      rows: { launch: 'LAUNCH' },
    },
  },

  exploreSpace: {
    title: 'KEEP EXPLORING THE SKY',
    subtitle:
      'If precession and the real sky intrigue you: observatories, interactive sky maps, ephemerides, outreach. Official sources (NASA, ESA, IAU). Links open in a new tab.',
    closeLabel: 'CLOSE',
    closeAriaLabel: 'Close',
    footerCredit: 'Designed by Garance Wetzel',
    githubAriaLabel: 'Garance Wetzel’s GitHub',
    emailCopyAriaLabel: (email: string): string => `Copy email: ${email}`,
    emailCopiedAriaLabel: (email: string): string => `Email copied: ${email}`,
    emailCopyTitle: (email: string): string => `Copy ${email}`,
    emailCopiedTitle: 'Email copied',
    emailCopiedBadge: 'Copied',
    sections: [
      {
        title: 'NASA',
        links: [
          {
            label: 'Science — solar system (missions, data)',
            href: 'https://science.nasa.gov/solar-system/',
          },
          {
            label: 'Science — universe (galaxies, black holes, cosmology)',
            href: 'https://science.nasa.gov/universe/',
          },
          { label: 'Astronomy Picture of the Day (APOD)', href: 'https://apod.nasa.gov/apod/astropix.html' },
          { label: 'James Webb Space Telescope', href: 'https://webb.nasa.gov/' },
          { label: 'NASA+ — videos and live streams', href: 'https://plus.nasa.gov/' },
        ],
      },
      {
        title: 'ESA & partners',
        links: [
          {
            label: 'ESA — scientific exploration',
            href: 'https://www.esa.int/Science_Exploration/Space_Science',
          },
          {
            label: 'Gaia — map of billions of stars',
            href: 'https://www.cosmos.esa.int/web/gaia',
          },
          { label: 'Hubble / observations', href: 'https://esahubble.org/' },
        ],
      },
      {
        title: 'Sky maps & ephemerides',
        links: [
          { label: 'Stellarium Web — interactive sky', href: 'https://stellarium-web.org/' },
          {
            label: 'TheSkyLive — planet and comet positions',
            href: 'https://theskylive.com/',
          },
          {
            label: 'Heavens-Above — ISS and satellite passes',
            href: 'https://www.heavens-above.com/',
          },
        ],
      },
      {
        title: 'Data & education',
        links: [
          { label: 'JPL Horizons — precise ephemerides', href: 'https://ssd.jpl.nasa.gov/horizons/' },
          {
            label: 'NASA SpacePlace — outreach for young audiences',
            href: 'https://spaceplace.nasa.gov/',
          },
          { label: 'IAU — astronomy and nomenclature', href: 'https://www.iau.org/' },
        ],
      },
    ],
  },

  legend: {
    title: 'LEGEND',
    subtitle: 'SYMBOLS · COLORS · LAYERS',
    sections: {
      bodies: 'BODIES',
      guides: 'SKY GUIDES',
      relics: 'ORBITAL RELICS',
    },
    guideLabels: {
      axis: 'Earth’s axis (rotation)',
      equator: 'Celestial equator',
      ecliptic: 'Ecliptic (Sun’s path)',
    },
    bodyLabels: { sun: 'Sun', moon: 'Moon' },
    toggleVisible: 'visible',
    toggleHidden: 'hidden',
  },

  hudFrame: {
    modeNatal: 'NATAL SKY',
    modeLive: 'LIVE SKY',
    placeLabelFallback: 'Natal sky',
    summaryAriaLabel: (mode: string, main: string): string =>
      `See my true sign — ${mode} · ${main}`,
  },

  languageSwitcher: {
    ariaLabel: 'Choose language',
    tooltip: 'Language',
    options: { fr: 'Français', en: 'English' },
    shortOptions: { fr: 'FR', en: 'EN' },
  },

  installPwa: {
    ariaLabel: 'Install the app',
    dismissAriaLabel: 'Later',
    android: {
      title: 'Install the app',
      body: 'Add Signe astronomique to your home screen for one-tap access.',
      cta: 'Install',
    },
    ios: {
      title: 'Add to Home Screen',
      body: 'Tap Share ↑, then “Add to Home Screen” to install the app.',
    },
  },

  bodies: {
    sun: 'Sun',
    moon: 'Moon',
  },

  moonPhases: {
    new: 'New',
    waxingCrescent: 'Waxing crescent',
    firstQuarter: 'First quarter',
    waxingGibbous: 'Waxing gibbous',
    full: 'Full',
    waningGibbous: 'Waning gibbous',
    lastQuarter: 'Last quarter',
    waningCrescent: 'Waning crescent',
  },

  intlLocale: 'en-US',
  htmlLang: 'en',
};
