import { useMemo } from 'react';
import { twoline2satrec, type SatRec } from 'satellite.js';
import {
  SATELLITE_RELICS,
  isSilentEra,
  relicsAvailableOn,
  type SatelliteRelic,
} from '../data/satellitesDB';

/** A relic with its parsed SGP4 record, ready to propagate at any time. */
export interface ParsedRelic {
  relic: SatelliteRelic;
  satrec: SatRec;
}

export interface SatelliteTrackerResult {
  /** Filtered + parsed relics, ready for the layer to propagate. */
  satellites: ParsedRelic[];
  /** True when `selectedDate` precedes the space age (1957). */
  silentEra: boolean;
}

interface Options {
  /**
   * Date the layer cares about. We only use it for *filtering by launch
   * date* (and the silent-era check) — actual propagation happens inside
   * the layer so live motion can update per frame.
   */
  selectedDate: Date;
  /**
   * Global toggle. When `false`, returns an empty result without parsing
   * anything — saves work whenever the layer is hidden.
   */
  enabled: boolean;
}

/**
 * Filters the catalog by launch date and parses TLEs into SatRec objects.
 *
 * Why not propagate here:
 * - In live mode the layer wants per-frame motion, which means propagating
 *   inside Cesium CallbackProperties — this hook would just throw work
 *   away every minute.
 * - The propagation is so cheap (a few µs per SatRec) that running it on
 *   the render thread is harmless and keeps the architecture simpler.
 *
 * The returned array is memoized on the *set of available relic ids* (a
 * stable key while no launch boundary is crossed), so the layer doesn't
 * remount each time `selectedDate` changes by a millisecond.
 */
export function useSatelliteTracker({
  selectedDate,
  enabled,
}: Options): SatelliteTrackerResult {
  // Stable memo key: the comma-joined list of relic ids visible at this
  // date. It only changes when `selectedDate` crosses a launch boundary.
  const availableKey = enabled
    ? relicsAvailableOn(selectedDate)
        .map((r) => r.id)
        .join(',')
    : '';
  const silentEra = isSilentEra(selectedDate);

  return useMemo(() => {
    if (!enabled || silentEra || availableKey === '') {
      return { satellites: [], silentEra };
    }

    const ids = new Set(availableKey.split(','));
    const satellites: ParsedRelic[] = [];
    for (const relic of SATELLITE_RELICS) {
      if (!ids.has(relic.id)) continue;
      try {
        const satrec = twoline2satrec(relic.tle[0], relic.tle[1]);
        satellites.push({ relic, satrec });
      } catch {
        // TLE we can't parse — skip silently, the layer would have
        // nothing to render anyway.
      }
    }

    return { satellites, silentEra };
  }, [availableKey, enabled, silentEra]);
}
