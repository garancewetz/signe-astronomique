import { useMemo, useState } from 'react';
import type { CityResult } from '../components/CityAutocomplete';
import { useGeolocation } from './useGeolocation';
import { timezoneFromLatLon } from '../utils/timezone';

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
}

/**
 * Owns the natal-form fields (date, time, city) plus the resolved city,
 * which falls back through `userCity → geoCity → DEFAULT_CITY`. Geolocation
 * is sampled once at mount via `useGeolocation` and surfaces as `geoCity`
 * once the browser resolves it.
 */
export function useNatalForm(): NatalFormState {
  const [date, setDate] = useState(() => formatInputDate(new Date()));
  const [time, setTime] = useState(() => formatInputTime(new Date()));
  const [userCity, setUserCity] = useState<CityResult | null>(null);

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

  return { date, time, city, setDate, setTime, setUserCity };
}
