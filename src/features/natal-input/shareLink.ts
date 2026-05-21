import type { CityResult } from './CityAutocomplete';
import { timezoneFromLatLon } from './timezone';

export interface SharedNatal {
  date: string;
  time: string;
  city: CityResult;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/**
 * Build a URLSearchParams that round-trips through `decodeNatalFromParams`.
 * Coordinates are clamped to 4 decimals (~11 m precision) — enough for a
 * natal chart and symmetrical with the rounding `signatureOf` uses for
 * search-history dedup, so a shared link recorded into history collapses
 * onto the same row as a typed-by-hand entry for the same city.
 */
export function encodeNatalToParams({ date, time, city }: SharedNatal): URLSearchParams {
  const params = new URLSearchParams();
  params.set('d', date);
  params.set('t', time);
  params.set('lat', city.lat.toFixed(4));
  params.set('lon', city.lon.toFixed(4));
  params.set('label', city.label);
  return params;
}

/**
 * Parse a shared natal payload from URL params. Returns null when any
 * required field is missing or malformed — we never fall back to partial
 * hydration, so the recipient either lands on a fully-formed sky or on
 * the default empty form.
 */
export function decodeNatalFromParams(params: URLSearchParams): SharedNatal | null {
  const date = params.get('d');
  const time = params.get('t');
  const latStr = params.get('lat');
  const lonStr = params.get('lon');
  const label = params.get('label');
  if (!date || !time || !latStr || !lonStr || !label) return null;
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) return null;
  const lat = Number(latStr);
  const lon = Number(lonStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return {
    date,
    time,
    city: { label, lat, lon, timezone: timezoneFromLatLon(lat, lon) },
  };
}

/** Absolute share URL pointing at the current origin + path, with natal params. */
export function buildShareUrl(natal: SharedNatal): string {
  if (typeof window === 'undefined') return '';
  const params = encodeNatalToParams(natal);
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?${params.toString()}`;
}

/** Read the current URL for a shared payload. Returns null when none present. */
export function readNatalFromCurrentUrl(): SharedNatal | null {
  if (typeof window === 'undefined') return null;
  return decodeNatalFromParams(new URLSearchParams(window.location.search));
}

/**
 * Strip natal params from the address bar after we've consumed them, so a
 * page reload doesn't re-trigger the auto-jump and the URL stays clean
 * while the user keeps editing.
 */
export function clearNatalFromUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  ['d', 't', 'lat', 'lon', 'label'].forEach((k) => url.searchParams.delete(k));
  const next = `${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ''}${url.hash}`;
  window.history.replaceState(window.history.state, '', next);
}
