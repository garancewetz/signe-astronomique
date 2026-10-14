import { useMemo, useState } from 'react';
import type { CityResult } from './CityAutocomplete';
import { useGeolocation } from './useGeolocation';
import { readNatalFromCurrentUrl, type SharedNatal } from './shareLink';
import { timezoneFromLatLon } from './timezone';

// Fallback places carry no label: they only stand in for the time zone when
// the visitor left the place out, so nothing may present them as a birthplace.
const DEFAULT_CITY: CityResult = {
  label: '',
  lat: 48.8566,
  lon: 2.3522,
  timezone: timezoneFromLatLon(48.8566, 2.3522),
};

export interface NatalFormState {
  date: string;
  time: string;
  city: CityResult;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setUserCity: (v: CityResult) => void;
  /**
   * Snapshot of the natal payload decoded from the URL at mount, or null
   * when no share-link params were present. Consumers use this to
   * auto-compute the reading once on first paint — see Cockpit.tsx.
   */
  sharedFromUrl: SharedNatal | null;
}

/**
 * Owns the natal-form fields (date, time, city) plus the resolved city,
 * which falls back through `userCity → geoCity → DEFAULT_CITY`. Geolocation
 * is sampled once at mount via `useGeolocation` and surfaces as `geoCity`
 * once the browser resolves it.
 *
 * If the page URL carries a shared natal payload (see [[shareLink]]), the
 * initial values are seeded from it instead of empty fields / geolocation.
 */
export function useNatalForm(): NatalFormState {
  const sharedFromUrl = useMemo(() => readNatalFromCurrentUrl(), []);

  // Empty by default: a prefilled "today" got computed as-is by visitors in
  // a hurry. An empty time means "unknown" (noon, see DEFAULT_BIRTH_TIME).
  const [date, setDate] = useState(() => sharedFromUrl?.date ?? '');
  const [time, setTime] = useState(() => sharedFromUrl?.time ?? '');
  const [userCity, setUserCity] = useState<CityResult | null>(
    () => sharedFromUrl?.city ?? null,
  );

  const geolocation = useGeolocation();

  const geoCity = useMemo<CityResult | null>(() => {
    if (geolocation.status !== 'resolved') return null;
    return {
      label: '',
      lat: geolocation.lat,
      lon: geolocation.lon,
      timezone: timezoneFromLatLon(geolocation.lat, geolocation.lon),
    };
  }, [geolocation]);

  const city = userCity ?? geoCity ?? DEFAULT_CITY;

  return { date, time, city, setDate, setTime, setUserCity, sharedFromUrl };
}
