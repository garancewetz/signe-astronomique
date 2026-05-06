import tzlookup from 'tz-lookup';

/** IANA timezone name for the given coordinates (e.g. "Europe/Paris"). */
export function timezoneFromLatLon(lat: number, lon: number): string {
  return tzlookup(lat, lon);
}

function tzOffsetMinutes(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find(p => p.type === t)!.value);
  const h = get('hour') === 24 ? 0 : get('hour');
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), h, get('minute'), get('second'));
  return (asUtc - utcMs) / 60000;
}

/**
 * Convert a wall-clock birth date/time (interpreted in `tz`) to a real UTC Date.
 * Inputs match HTML <input type="date|time"> values: "YYYY-MM-DD" / "HH:MM".
 */
export function localBirthToUtc(dateStr: string, timeStr: string, tz: string): Date {
  const [Y, M, D] = dateStr.split('-').map(Number);
  const [h, m] = timeStr.split(':').map(Number);
  // Pretend the wall-clock time IS UTC, then back out the actual offset
  // that the target timezone has at *that* instant (DST-aware).
  const guess = Date.UTC(Y, M - 1, D, h, m);
  const offset = tzOffsetMinutes(guess, tz);
  return new Date(guess - offset * 60000);
}
