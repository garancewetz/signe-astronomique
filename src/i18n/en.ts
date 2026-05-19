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
    todayLabel: 'Today',
    todayAriaLabel: 'Today — compute the current sky',
    dateLabel: 'DATE',
    timeLabel: 'TIME',
    placeLabel: 'BIRTHPLACE',
    placePlaceholder: 'Birth city…',
    submitIdle: 'COMPUTE MY SIGN',
    submitBusy: 'Computing the sky…',
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

  orbital: {
    errorBody:
      'Couldn’t reach Celestrak — the orbital population is unavailable.',
    retryLabel: 'Retry',
    retryAriaLabel: 'Retry loading the orbital population',
  },

  analysis: {
    sectionLabel: 'REPORT',
    title: 'ANALYSIS',
    tablistAriaLabel: 'Analysis sections',
    closeAriaLabel: 'Close analysis',
    tabs: {
      resume: { label: 'My sign', sublabel: 'Your birth sky' },
      carte: { label: 'Chart', sublabel: 'Wheel of constellations' },
      lecture: { label: 'Reading', sublabel: 'Understand your chart' },
      donnees: { label: 'Data', sublabel: 'Raw astronomy' },
    },
    panelTitles: {
      resume: 'MY SIGN',
      carte: 'CHART',
      lecture: 'READING',
      donnees: 'DATA',
    },
    panelSubtitles: {
      resume: 'YOUR BIRTH SKY',
      carte: 'WHEEL OF CONSTELLATIONS',
      lecture: 'UNDERSTAND YOUR CHART',
      donnees: 'RAW ASTRONOMY',
    },
    panelCloseAriaLabel: (title: string): string =>
      `Close the ${title.toLowerCase()} panel`,
  },

  analysisCta: {
    openAriaLabel: 'Open analysis',
    lockedAriaLabel: 'Analysis — locked · enter your coordinates',
    tooltipReady: 'Analysis',
    tooltipLocked: 'Analysis · locked',
    label: 'Analysis',
  },

  mobile: {
    coordinatesModal: {
      ariaLabel: 'My birth coordinates',
      sectionLabel: 'Console',
      title: 'My coordinates',
      closeAriaLabel: 'Close',
      editAriaLabel: 'Edit my birth coordinates',
    },
    systemDrawer: {
      ariaLabel: 'System menu',
      backdropAriaLabel: 'Close the system menu',
      openAriaLabel: 'Open the system menu',
      fullscreenEnter: 'Fullscreen',
      fullscreenExit: 'Exit fullscreen',
      legend: { label: 'Legend', sublabel: 'Symbols · colors · layers' },
      explore: { label: 'Useful links', sublabel: 'Sky maps · ephemerides' },
      exportView: { label: 'Export view', sublabel: '3D sky PNG' },
      exportReport: {
        label: 'Export report',
        sublabelReady: 'A4 PDF — view + full chart',
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
      selection: 'Selection',
      display: 'Display',
      navigation: 'Navigation',
      analysis: 'Analysis',
    },
    sheet: {
      home: {
        eyebrow: 'Console',
        ctaModifyCoords: 'EDIT MY COORDINATES',
        ctaCalculate: 'COMPUTE MY SIGN',
        hint:
          'Pick a section in the bottom bar — display, navigation, or analysis once your sky is computed.',
      },
      selection: {
        eyebrow: 'Selection',
        empty: 'Tap a body in the 3D view to see its information here.',
      },
      display: {
        eyebrow: 'Display',
        labels: { label: 'Names and lines', sublabel: 'Bodies · constellations' },
        guides: { label: 'Sky guides', sublabel: 'Axis · equator · ecliptic' },
        orbital: {
          label: 'Orbital population',
          sublabelUnavailable: 'Unavailable for this date',
          sublabelLoading: 'Loading Celestrak…',
          sublabelError: 'Retry',
          sublabelLive: 'Real time · Celestrak',
        },
        relics: { label: 'Orbital relics', sublabel: 'Historic satellites' },
        sideView: {
          label: 'Axial perspective',
          sublabelReady: 'Side view · constellation',
          sublabelLocked: 'Select a star',
        },
      },
      navigation: {
        eyebrow: 'Navigation',
        sun: { label: 'Sun', sublabel: 'Center the camera' },
        moon: { label: 'Moon', sublabel: 'Center the camera' },
        earth: { label: 'Earth', sublabel: 'Default orbital view' },
      },
      analysis: {
        eyebrow: 'Analysis',
        resume: { label: 'My sign', sublabel: 'Your birth sky' },
        carte: { label: 'Chart', sublabel: 'Wheel of constellations' },
        lecture: { label: 'Reading', sublabel: 'Understand your chart' },
        donnees: { label: 'Data', sublabel: 'Raw astronomy' },
      },
    },
    bottomSheet: {
      defaultAriaLabel: 'Console',
      collapseAriaLabel: 'Collapse the console',
      expandAriaLabel: 'Expand the console',
      openAriaLabel: 'Open the console',
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

  radarWheel: {
    emptyTitle: 'Empty astronomical zodiac wheel.',
    emptyDescription:
      'Radar wheel of the 13 IAU constellations, waiting for a computed natal chart.',
    title: (sunName: string): string =>
      `Astronomical zodiac wheel — Sun in ${sunName}.`,
    description: (args: {
      dateLabel: string;
      place: string;
      sunName: string;
      ascendantDeg: number;
    }): string =>
      `Position of the Sun, the Moon and the planets on ${args.dateLabel}${args.place ? `, ${args.place}` : ''}, ` +
      `projected onto the 13 IAU constellations. Solar constellation: ${args.sunName}. ` +
      `Ascendant at ${args.ascendantDeg.toFixed(1)}° of ecliptic longitude.`,
    asc: 'ASC',
    centerLabel: 'TC ECLIPTIC J2000',
    localSuffix: 'LOCAL',
    utcSuffix: 'UTC',
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
      orbital: 'Orbital',
      orbitalAria: {
        loading: 'Orbital population — loading Celestrak…',
        error: 'Orbital population — retry',
        live: 'Orbital population (real time)',
        unavailable: 'Orbital population — unavailable for this date',
      },
      relics: 'Relics',
      sideView: 'Side view',
      sideViewLocked: 'Side view · select a star',
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
      tooltipReady: 'Export the 3D view and full report as an A4 PDF',
      tooltipGenerating: 'Generating PDF…',
      tooltipLocked: 'Compute a natal chart first to export the PDF',
      ariaLabel: 'Export the 3D view and full report as a PDF',
    },
  },

  bodyInfo: {
    star: {
      eyebrowPrefix: 'STAR',
      footer:
        'Switch to the axial view to see the figure come apart: from Earth, the stars look aligned; seen from the side, they’re separated by hundreds of light-years.',
      rows: { distance: 'DISTANCE', magnitude: 'MAGNITUDE', depth: 'DEPTH' },
      modeToggleLabel: 'AXIAL_PERSPECTIVE',
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

  resumeBody: {
    toggleLabelsHide: 'Hide constellations',
    toggleLabelsShow: 'Show constellations',
  },

  birthHeader: {
    eyebrow: 'NATAL CHART · REAL SKY AT BIRTH',
    placeLabelFallback: 'Natal sky',
    north: 'N',
    south: 'S',
    east: 'E',
    west: 'W',
  },

  resumeCard: {
    sectionLabel: 'YOUR SKY AT A GLANCE',
    rows: {
      trueSign: 'True sign (Sun)',
      moon: 'Moon',
      ascendant: 'Ascendant',
      seasonMoment: 'Season · moment',
    },
    revealAriaLabel: 'See this constellation in the sky',
    revealTooltip: 'See this constellation in the sky',
  },

  seasons: {
    spring: 'Spring',
    summer: 'Summer',
    autumn: 'Autumn',
    winter: 'Winter',
  },

  timeOfDay: {
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
  },

  ascendantCard: {
    sectionLabel: '↑ ASCENDANT · EASTERN HORIZON',
    lstLabel: 'LST',
  },

  howToRead: {
    sectionLabel: 'HOW TO READ YOUR SKY CHART',
    intro:
      'What you see is the **real sky** as it was above the place, on the date and at the time of your birth — not a symbolic diagram.',
    layersHintPrefix: 'Turn on the ',
    layersHintEmphasis: 'Guides',
    layersHintSuffix:
      ' layer in the sidebar to see Earth’s rotation axis, the celestial equator (its projection on the dome) and the ecliptic — the Sun’s apparent path across the year. The thirteen zodiacal constellations are the ones that path crosses.',
    boundaries:
      'The boundaries drawn here are the ones set by the IAU in 1930 (E. Delporte), traced from star positions. They don’t form twelve equal slices: the Sun stays 45 days in Virgo, 19 in Ophiuchus, and only 6 in Scorpius. The astrological calendar smoothed that real geometry into twelve 30° slices.',
  },

  twoMotions: {
    sectionLabel: 'TWO MOTIONS, TWO SIGNS',
    solar: {
      lead: 'Your ',
      leadEmphasis: 'solar sign',
      mid: ' depends on where the Sun sits in the zodiac. The Sun takes ',
      midEmphasis: '~365 days',
      mid2: ' to travel along the ecliptic; the astrological calendar carves it into ',
      mid2Emphasis: '12 sectors of 30°',
      tail:
        ', roughly 30 days each. That’s why a date alone is enough to determine it.',
    },
    ascendant: {
      lead: 'Your ',
      leadEmphasis: 'ascendant',
      mid: ', though, is the sign that was rising just above the eastern horizon at the precise moment of your birth. And Earth completes one full rotation every ',
      midEmphasis: '24 h',
      mid2: ': the 360° of the zodiac sweep past the horizon in a day, so a new sign roughly every ',
      mid2Emphasis: '~2 h',
      tail: '.',
    },
    summary: {
      lead: 'Hence the asymmetry: Earth’s ',
      leadEmphasis: 'annual revolution',
      mid: ' around the Sun sets the solar sign; its ',
      midEmphasis: 'daily rotation',
      tail:
        ' sets the ascendant. That’s also why your birthplace matters: the eastern horizon depends on latitude and longitude.',
    },
  },

  planetTable: {
    sectionLabel: 'PLANETARY POSITIONS · HOUSES',
    columns: { body: 'BODY', constellation: 'CONSTELLATION', degree: 'DEG', house: 'HOUSE' },
    footnote: 'Equal houses (approx.)',
  },

  astroInfoCard: {
    sectionLabel: 'RAW ASTRONOMICAL DATA',
    rows: {
      lst: 'Local sidereal time',
      julianDay: 'Julian day',
      obliquity: 'Obliquity of the ecliptic',
      precessionGap: 'Precession gap',
    },
    daysUnit: 'd',
  },

  notesCard: {
    sectionLabel: 'YOUR SIGN: ASTROLOGICAL vs ASTRONOMICAL',
    tropicalIntroLead: 'The astrological calendar places you under the sign ',
    tropicalIntroTail:
      ' — a 30° slice carved from the vernal point 2,000 years ago.',
    realityLead: 'On that same date, the Sun was actually in the constellation ',
    realityMid: ': that’s your true astronomical sign. The precession of the equinoxes has drifted the sky about ',
    realityTail: ' days away from the zodiac’s historical anchor.',
    matchedCase:
      'For this date, the astrological calendar slice and the Sun’s IAU constellation coincide — a rare case. Elsewhere along the ecliptic, precession almost always separates them by a full sign.',
    method:
      'The computation rests on positional astronomy: Meeus ephemerides, IAU/Delporte boundaries, ICRS J2000 frame. No symbolic interpretation — just where the bodies were.',
  },

  scientificFooter: 'ICRS J2000 · MEEUS 1998 · DELPORTE 1930',

  lockedStub: {
    eyebrow: 'Locked preview',
    sidebarHint: 'Enter your coordinates in the sidebar',
    resume: {
      headline: 'Your true sign, in the real sky',
      taglineLead:
        'The Sun almost never sat in the constellation your horoscope claims. Over 2,000 years, Earth’s axis has slid by about a full constellation — here is your ',
      taglineEmphasis: 'precise astronomical sky',
      taglineTail: ', drift included.',
    },
    carte: {
      headline: 'The wheel of true constellations',
      taglineLead: 'The Sun, Moon and planets projected onto the ',
      taglineEmphasis: '13 constellations',
      taglineTail:
        ' they actually cross — boundaries set by the International Astronomical Union (1930), not the 12 equal slices of the zodiac.',
    },
    lecture: {
      headline: 'Understand your chart',
      taglineSun: 'Sun',
      taglineSunDesc: ' (your true constellation), the ',
      taglineMoon: 'Moon',
      taglineMoonDesc: ' (its exact phase) and the ',
      taglineAscendant: 'ascendant',
      taglineAscendantDesc:
        ' (the eastern horizon point that was rising at your birth) — their astronomical definition, and how to spot them in the sky.',
      taglineLead: 'The ',
    },
    donnees: {
      headline: 'Positional astronomy',
      taglineLead: 'Right ascension, declination, sidereal time, obliquity of the ecliptic: the ',
      taglineEmphasis: 'raw coordinates',
      taglineTail:
        ' of the sky at your birth — the celestial equivalent of latitude and longitude (Meeus 1998 · JPL · IAU 1930).',
    },
  },

  relicsOracle: {
    sectionLabel: 'ORACLE · ORBITAL RELICS',
    silencePoetic:
      '“In that year, Earth’s orbit belonged only to silence.”',
    silenceExplanation: (year: number): string =>
      `No human object had yet left the atmosphere — the first one, Sputnik 1, would not launch until ${year}.`,
    activeIntro:
      'At the moment of your birth, these human objects were circling (or had already circled) Earth:',
  },

  legend: {
    title: 'LEGEND',
    subtitle: 'SYMBOLS · COLORS · LAYERS',
    sections: {
      bodies: 'BODIES',
      guides: 'SKY GUIDES',
      relics: 'ORBITAL RELICS',
      orbital: 'ORBITAL POPULATION',
    },
    guideLabels: {
      axis: 'Earth’s axis (rotation)',
      equator: 'Celestial equator',
      ecliptic: 'Ecliptic (Sun’s path)',
    },
    bodyLabels: { sun: 'Sun', moon: 'Moon' },
    orbitalRealTime: 'real time',
    toggleVisible: 'visible',
    toggleHidden: 'hidden',
  },

  hudFrame: {
    modeNatal: 'NATAL SKY',
    modeLive: 'LIVE SKY',
    placeLabelFallback: 'Natal sky',
    summaryAriaLabel: (mode: string, main: string): string =>
      `Open the MY SIGN card — ${mode} · ${main}`,
  },

  languageSwitcher: {
    ariaLabel: 'Choose language',
    tooltip: 'Language',
    options: { fr: 'Français', en: 'English' },
    shortOptions: { fr: 'FR', en: 'EN' },
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
