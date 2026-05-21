import { useMemo, useState } from 'react';
import type { CityResult } from './CityAutocomplete';
import { useGeolocation } from './useGeolocation';
import { readNatalFromCurrentUrl, type SharedNatal } from './shareLink';
import { timezoneFromLatLon } from './timezone';

const DEFAULT_CITY: CityResult = {
  label: 'Paris, France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: timezoneFromLatLon(48.8566, 2.3522),
};

function formatInputDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatInputTime(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

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
 * initial values are seeded from it instead of `new Date()` / geolocation.
 */
export function useNatalForm(): NatalFormState {
  const sharedFromUrl = useMemo(() => readNatalFromCurrentUrl(), []);

  const [date, setDate] = useState(
    () => sharedFromUrl?.date ?? formatInputDate(new Date()),
  );
  const [time, setTime] = useState(
    () => sharedFromUrl?.time ?? formatInputTime(new Date()),
  );
  const [userCity, setUserCity] = useState<CityResult | null>(
    () => sharedFromUrl?.city ?? null,
  );

  const geolocation = useGeolocation();

  const geoCity = useMemo<CityResult | null>(() => {
    if (geolocation.status !== 'resolved') return null;
    return {
      label: 'Position actuelle',
      lat: geolocation.lat,
      lon: geolocation.lon,
      timezone: timezoneFromLatLon(geolocation.lat, geolocation.lon),
    };
  }, [geolocation]);

  const city = userCity ?? geoCity ?? DEFAULT_CITY;

  return { date, time, city, setDate, setTime, setUserCity, sharedFromUrl };
}
