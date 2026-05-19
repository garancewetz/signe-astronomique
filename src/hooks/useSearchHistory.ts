import { useCallback, useEffect, useState } from 'react';
import type { CityResult } from '../components/CityAutocomplete';

const STORAGE_KEY = 'tcs:search-history:v1';
const MAX_ENTRIES = 6;

export interface SearchHistoryEntry {
  date: string;
  time: string;
  city: CityResult;
  savedAt: number;
}

export interface SearchHistoryState {
  entries: SearchHistoryEntry[];
  record: (entry: Omit<SearchHistoryEntry, 'savedAt'>) => void;
  remove: (signature: string) => void;
  clear: () => void;
}

/**
 * Stable identity for an entry: same date, time, and city → same signature.
 * Lat/lon are rounded so floating-point noise (e.g. two slightly different
 * geocoder hits for the same town) doesn't fragment history.
 */
export function signatureOf(e: {
  date: string;
  time: string;
  city: Pick<CityResult, 'label' | 'lat' | 'lon'>;
}): string {
  return `${e.date}|${e.time}|${e.city.label}|${e.city.lat.toFixed(4)}|${e.city.lon.toFixed(4)}`;
}

function isValidEntry(x: unknown): x is SearchHistoryEntry {
  if (!x || typeof x !== 'object') return false;
  const e = x as Record<string, unknown>;
  if (
    typeof e.date !== 'string' ||
    typeof e.time !== 'string' ||
    typeof e.savedAt !== 'number'
  ) {
    return false;
  }
  const c = e.city as Record<string, unknown> | null | undefined;
  if (!c || typeof c !== 'object') return false;
  return (
    typeof c.label === 'string' &&
    typeof c.lat === 'number' &&
    typeof c.lon === 'number' &&
    typeof c.timezone === 'string'
  );
}

function readStorage(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function writeStorage(entries: SearchHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded or storage disabled (Safari private mode, etc.) —
    // silently drop the persistence; in-memory state stays correct for
    // the rest of the session.
  }
}

/**
 * Persists the user's recent natal searches (date + time + city) to
 * localStorage. Dedup by (date, time, city) signature so re-searching
 * the same instant bubbles the entry to the top instead of accumulating
 * duplicates. Capped at MAX_ENTRIES; oldest entries fall off the tail.
 */
export function useSearchHistory(): SearchHistoryState {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>(() => readStorage());

  useEffect(() => {
    writeStorage(entries);
  }, [entries]);

  const record = useCallback((entry: Omit<SearchHistoryEntry, 'savedAt'>) => {
    const sig = signatureOf(entry);
    setEntries((prev) => {
      const filtered = prev.filter((e) => signatureOf(e) !== sig);
      const next: SearchHistoryEntry = { ...entry, savedAt: Date.now() };
      return [next, ...filtered].slice(0, MAX_ENTRIES);
    });
  }, []);

  const remove = useCallback((signature: string) => {
    setEntries((prev) => prev.filter((e) => signatureOf(e) !== signature));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, record, remove, clear };
}
