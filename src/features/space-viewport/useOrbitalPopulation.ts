import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { twoline2satrec, type SatRec } from 'satellite.js';

export type OrbitalCategory = 'starlink' | 'weather' | 'nav' | 'comm' | 'other';

export interface OrbitalSat {
  name: string;
  satrec: SatRec;
  category: OrbitalCategory;
  /** Launch year extracted from the TLE international designator (null if unavailable). */
  launchYear: number | null;
}

export type OrbitalStatus = 'idle' | 'loading' | 'ready' | 'error';

// Celestrak rate-limits the giant `GROUP=active` payload (~5 MB) per IP — a
// few hits and they 403 you for hours. Compose smaller typed groups instead.
// Each one is well under 200 KB and matches our visual category split.
const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle&GROUP=';
const CELESTRAK_GROUPS = [
  'stations',      // ISS, CSS, manned/scientific platforms
  'weather',       // NOAA/GOES/Meteor/Fengyun
  'noaa',          // legacy NOAA polar
  'goes',          // GOES geostationary weather
  'resource',      // earth resources (Landsat, Sentinel)
  'gps-ops',       // GPS
  'galileo',       // Galileo
  'glo-ops',       // GLONASS operational
  'beidou',        // BeiDou
  'geo',           // geostationary band (Intelsat, SES, Eutelsat, …)
  'intelsat',      // Intelsat fleet
  'ses',           // SES fleet
  'iridium-NEXT',  // Iridium constellation
  'oneweb',        // OneWeb constellation
  'science',       // scientific (Hubble, JWST proxies, etc.)
];

// Supplemental Starlink TLEs (SpaceX-provided, fresher than standard GP).
const CELESTRAK_STARLINK_URL =
  'https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle';

// Hard cap after merge — keeps the SGP4 batch at ~20 ms per 1-second tick.
const MAX_DISPLAY = 4000;

// ─── module-level store ─────────────────────────────────────────────────────
// Survives toggle-off/on without re-fetching, and lets every consumer of the
// hook subscribe via useSyncExternalStore (no setState-in-effect round-trip).

const EMPTY_SATS: OrbitalSat[] = [];

let cacheRef: OrbitalSat[] = EMPTY_SATS;
let statusRef: OrbitalStatus = 'idle';
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setCache(next: OrbitalSat[]) {
  cacheRef = next;
  statusRef = 'ready';
  emit();
}

function setStatus(next: OrbitalStatus) {
  statusRef = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => cacheRef;
const getStatusSnapshot = () => statusRef;

/**
 * Fetches the full active satellite catalog + supplemental Starlink TLEs from
 * Celestrak, merges them (supplemental wins on duplicate NORAD IDs), and
 * returns a typed, categorized array ready for the orbital layer.
 *
 * Only fetches once per session. Subsequent mounts read the in-memory store.
 */
export function useOrbitalPopulation(enabled: boolean): {
  satellites: OrbitalSat[];
  status: OrbitalStatus;
  /** Force a refetch — used by the UI retry affordance after an error. */
  retry: () => void;
} {
  const satellites = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const status = useSyncExternalStore(subscribe, getStatusSnapshot, getStatusSnapshot);
  // Bumped by retry() to force a re-run of the fetch effect. Cheaper than
  // a state-machine inside the hook.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (cacheRef.length > 0) return;
    setStatus('loading');
    const controller = new AbortController();
    const signal = controller.signal;

    // Fire all groups in parallel. settleAllSafe tolerates per-group failures
    // (a single 403 from one rate-limited group shouldn't kill the layer).
    const groupUrls = CELESTRAK_GROUPS.map((g) => CELESTRAK_BASE + g);
    Promise.all([
      settleAllSafe(groupUrls.map((u) => fetchTleGroup(u, signal))),
      fetchTleGroup(CELESTRAK_STARLINK_URL, signal).catch(() => [] as OrbitalSat[]),
    ])
      .then(([groups, starlink]) => {
        const general = groups.flat();
        if (general.length === 0 && starlink.length === 0) {
          setStatus('error');
          return;
        }
        setCache(mergePopulations(general, starlink));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('[OrbitalPopulation] fetch failed:', err);
        setStatus('error');
      });

    return () => controller.abort();
  }, [enabled, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { satellites, status, retry };
}

// ─── internals ──────────────────────────────────────────────────────────────

async function fetchTleGroup(
  url: string,
  signal: AbortSignal,
): Promise<OrbitalSat[]> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return parseTleText(await r.text());
}

/** Resolve all promises, swap rejections for empty arrays (logged once). */
async function settleAllSafe(
  promises: Array<Promise<OrbitalSat[]>>,
): Promise<OrbitalSat[][]> {
  const results = await Promise.allSettled(promises);
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    console.warn(
      `[OrbitalPopulation] group ${i} failed (likely rate-limited):`,
      r.reason instanceof Error ? r.reason.message : r.reason,
    );
    return [];
  });
}

/**
 * Merge general + supplemental Starlink, deduplicated by NORAD satellite
 * number. Supplemental entries overwrite general ones (fresher TLE).
 * Caps to MAX_DISPLAY so the SGP4 batch stays within frame budget.
 */
function mergePopulations(
  general: OrbitalSat[],
  starlink: OrbitalSat[],
): OrbitalSat[] {
  const byId = new Map<number, OrbitalSat>();
  for (const sat of general) byId.set(Number(sat.satrec.satnum), sat);
  for (const sat of starlink) byId.set(Number(sat.satrec.satnum), sat);
  return [...byId.values()].slice(0, MAX_DISPLAY);
}

function parseTleText(text: string): OrbitalSat[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const sats: OrbitalSat[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) continue;
    try {
      sats.push({
        name,
        satrec: twoline2satrec(line1, line2),
        category: categorize(name),
        launchYear: launchYearFromLine1(line1),
      });
    } catch {
      // unparseable TLE — skip silently
    }
  }
  return sats;
}

/** Derive orbital category from satellite name. */
function categorize(name: string): OrbitalCategory {
  const n = name.toUpperCase();
  if (n.includes('STARLINK') || n.includes('ONEWEB') || n.includes('IRIDIUM') ||
      n.includes('GLOBALSTAR') || n.includes('ORBCOMM')) return 'starlink';
  if (n.includes('NOAA') || n.includes('GOES') || n.includes('METEOSAT') ||
      n.includes('METEOR-') || n.includes('FENGYUN') || n.includes('HIMAWARI') ||
      n.includes('SUOMI') || n.includes('JPSS') || n.includes('METOP') ||
      n.includes('AQUA') || n.includes('TERRA') || n.includes('LANDSAT') ||
      n.includes('SENTINEL') || n.includes('MSG ')) return 'weather';
  if (n.includes('GPS') || n.includes('NAVSTAR') || n.includes('GALILEO') ||
      n.includes('GLONASS') || n.includes('BEIDOU') || n.includes('COMPASS') ||
      n.includes('QZSS') || n.includes('NAVIC') || n.includes('IRNSS')) return 'nav';
  if (n.includes('INTELSAT') || n.includes('INMARSAT') || n.includes('SES-') ||
      n.includes('EUTELSAT') || n.includes('ASTRA ') || n.includes('TELESAT') ||
      n.includes('VIASAT') || n.includes('ECHOSTAR')) return 'comm';
  return 'other';
}

/**
 * Extract launch year from TLE line 1 international designator (cols 10–17).
 * Format: YYLLL... where YY ≥ 57 → 19YY, else 20YY.
 */
function launchYearFromLine1(line1: string): number | null {
  const designator = line1.slice(9, 17).trim();
  if (!designator) return null;
  const yy = parseInt(designator.slice(0, 2), 10);
  if (isNaN(yy)) return null;
  return yy >= 57 ? 1900 + yy : 2000 + yy;
}
