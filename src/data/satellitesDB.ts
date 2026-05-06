/**
 * Catalogue of "orbital relics" — a poetic sample of human spaceflight,
 * propagated at natal time via SGP4 (satellite.js).
 *
 * Each TLE has an `epoch` (cols 19-32 of line 1) — that's the reference time
 * SGP4 propagates from. SGP4 stays accurate for ~weeks around its epoch and
 * starts producing NaN/false results far past it. So we pick the epoch
 * carefully:
 *
 *  - Active satellites (Hubble, ISS, Starlink) — recent (~2025) epoch, so
 *    `live` mode (today) and natal dates within the last decade or two
 *    propagate without numerical failure.
 *  - Decommissioned satellites (Sputnik, Telstar, Landsat, Mir) — launch-era
 *    epoch. They render correctly when the natal date is near their
 *    operational window. Propagation may fail for very far natal dates;
 *    the layer hides such entities silently.
 *
 * satellite.js doesn't validate TLE checksums, so the trailing checksum
 * digits don't matter — only the data columns do.
 */

export interface SatelliteRelic {
  /** Stable internal id (slug). */
  id: string;
  /** Display name shown on Cesium labels. */
  name: string;
  /** Launch date (ISO YYYY-MM-DD). Used for temporal filtering. */
  launchDate: string;
  /** Short narrative shown in the Lecture panel when the relic is listed. */
  blurb: string;
  /** CSS color of the glowing point (cyan by default, amber for pioneers). */
  glowColor: string;
  /** TLE pair (line1, line2) for SGP4. */
  tle: [string, string];
}

/**
 * NOTE — approximate historical TLEs. Inclinations / periods match the real
 * vehicles; longitudes / mean anomalies are indicative.
 */
export const SATELLITE_RELICS: SatelliteRelic[] = [
  {
    id: 'sputnik-1',
    name: 'Sputnik 1',
    launchDate: '1957-10-04',
    blurb: 'Le premier murmure humain en orbite. 92 jours de bip, puis le silence.',
    glowColor: '#fbbf24',
    tle: [
      '1 00002U 57001B   57277.00000000  .00000000  00000-0  00000-0 0  9999',
      '2 00002  65.1000 351.0570 0521590  16.7625 354.0270 16.05819986    01',
    ],
  },
  {
    id: 'telstar-1',
    name: 'Telstar 1',
    launchDate: '1962-07-10',
    blurb: 'La première image télévisée traversant l\'Atlantique par l\'espace.',
    glowColor: '#fcd34d',
    tle: [
      '1 00340U 62029A   62192.50000000  .00000000  00000-0  00000-0 0  9999',
      '2 00340  44.7900 100.0000 4000000  90.0000   0.0000  6.50000000    01',
    ],
  },
  {
    id: 'landsat-1',
    name: 'Landsat 1',
    launchDate: '1972-07-23',
    blurb: 'Le premier regard systématique de la Terre sur elle-même.',
    glowColor: '#7dd3fc',
    tle: [
      '1 06126U 72058A   72205.50000000  .00000000  00000-0  00000-0 0  9999',
      '2 06126  99.0900 245.0000 0030000  81.0000 279.0000 13.95000000    01',
    ],
  },
  {
    id: 'mir',
    name: 'Mir',
    launchDate: '1986-02-19',
    blurb: 'La grande maison soviétique en orbite, habitée pendant quinze ans.',
    glowColor: '#f472b6',
    tle: [
      '1 16609U 86017A   86053.00000000  .00000000  00000-0  00000-0 0  9999',
      '2 16609  51.6470 173.4000 0001000   0.0000   0.0000 15.50000000    01',
    ],
  },
  {
    id: 'hubble',
    name: 'Hubble',
    launchDate: '1990-04-24',
    blurb: 'L\'œil hors de l\'atmosphère qui nous a appris la profondeur du temps.',
    glowColor: '#a78bfa',
    // Recent epoch (day 100 of 2025 ≈ 2025-04-10). Hubble is still active
    // at ~535 km, 28.47° inclination.
    tle: [
      '1 20580U 90037B   25100.50000000  .00001000  00000-0  50000-4 0  9999',
      '2 20580  28.4690 123.0000 0002500 100.0000 260.0000 15.10000000    01',
    ],
  },
  {
    id: 'iss',
    name: 'Station spatiale internationale',
    launchDate: '1998-11-20',
    blurb: 'Un avant-poste habité en permanence depuis l\'an 2000.',
    glowColor: '#67e8f9',
    // Recent epoch (2025-04-10) — ISS at ~420 km, 51.64° inclination.
    tle: [
      '1 25544U 98067A   25100.50000000  .00010000  00000-0  20000-3 0  9999',
      '2 25544  51.6400 100.0000 0003000  50.0000 300.0000 15.50000000    01',
    ],
  },
  {
    id: 'starlink',
    name: 'Starlink (constellation)',
    launchDate: '2019-05-24',
    blurb: 'Le premier maillage commercial à grande échelle de l\'orbite basse.',
    glowColor: '#22d3ee',
    // Recent epoch (2025-04-10) — representative Starlink LEO at ~550 km,
    // 53° inclination. The constellation has thousands of birds; we only
    // render one as a token of the whole.
    tle: [
      '1 44713U 19074A   25100.50000000  .00005000  00000-0  30000-3 0  9999',
      '2 44713  53.0000  50.0000 0001500  90.0000 270.0000 15.06000000    01',
    ],
  },
];

/** Year of the very first human object in orbit. Before: silence. */
export const SPACE_AGE_START_YEAR = 1957;

/**
 * Returns every satellite launched on or before `selectedDate`. Catalog
 * order (chronological) is preserved.
 */
export function relicsAvailableOn(selectedDate: Date): SatelliteRelic[] {
  const t = selectedDate.getTime();
  return SATELLITE_RELICS.filter(
    (r) => new Date(r.launchDate).getTime() <= t,
  );
}

/** True when `selectedDate` precedes the very first launch (Sputnik 1). */
export function isSilentEra(selectedDate: Date): boolean {
  return selectedDate.getUTCFullYear() < SPACE_AGE_START_YEAR;
}
