import { computeReading, type CelestialReading } from '@/features/astronomy';
import type { CityResult } from './CityAutocomplete';
import { localBirthToUtc } from './timezone';

export interface NatalFormInput {
  date: string;
  time: string;
  city: CityResult;
}

/**
 * Convert a wall-clock natal form (date, time, city) into a fully-computed
 * `CelestialReading`. Centralises the `localBirthToUtc → computeReading`
 * pipeline so submit, restore-from-history, and share-link auto-jump all
 * agree on the same conversion (in particular, the DST-aware `tz → UTC`
 * step is easy to forget when wiring a new entry point).
 */
export function computeReadingFromForm({ date, time, city }: NatalFormInput): CelestialReading {
  return computeReading({
    date: localBirthToUtc(date, time, city.timezone),
    latitude: city.lat,
    longitude: city.lon,
    placeLabel: city.label,
    timezone: city.timezone,
  });
}
