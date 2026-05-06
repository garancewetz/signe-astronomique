import { useEffect, useState } from 'react';

export type GeolocationStatus = 'pending' | 'resolved' | 'denied' | 'unsupported';

export interface GeolocationResult {
  lat: number;
  lon: number;
  status: GeolocationStatus;
}

/**
 * Fallback coords used while the browser hasn't answered, or whenever the
 * Geolocation API is denied / unavailable.
 */
export const PARIS_FALLBACK = { lat: 48.8566, lon: 2.3522 } as const;

/**
 * One-shot browser geolocation request at mount. Returns the latest known
 * value (Paris fallback while pending) plus a `status` field so callers can
 * tell a passive fallback from a real resolution.
 *
 * No polling: the natal sky is computed for a single instant — there's no
 * reason to track the device position over time.
 */
export function useGeolocation(): GeolocationResult {
  // Lazy initial state: if the API is missing, start as `unsupported`
  // straight away rather than `pending` — keeps the effect free of any
  // synchronous setState (the lint rule, and perf, prefer it that way).
  const [result, setResult] = useState<GeolocationResult>(() => {
    const hasApi =
      typeof navigator !== 'undefined' && 'geolocation' in navigator;
    return {
      ...PARIS_FALLBACK,
      status: hasApi ? 'pending' : 'unsupported',
    };
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (cancelled) return;
        setResult({
          lat: coords.latitude,
          lon: coords.longitude,
          status: 'resolved',
        });
      },
      () => {
        if (cancelled) return;
        setResult({ ...PARIS_FALLBACK, status: 'denied' });
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 10_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
