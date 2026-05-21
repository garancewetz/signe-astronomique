import { useEffect, useId, useRef, useState } from 'react';
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { timezoneFromLatLon } from './timezone';
import { useT } from '@/context/useLocale';

export interface CityResult {
  label: string;
  lat: number;
  lon: number;
  timezone: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  state?: string;
  region?: string;
  country?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  class?: string;
  type?: string;
  address?: NominatimAddress;
}

function isNominatimResult(x: unknown): x is NominatimResult {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.display_name === 'string' &&
    typeof r.lat === 'string' &&
    typeof r.lon === 'string'
  );
}

// Keep only results that represent a populated place a person could be born
// in — cities, towns, villages, hamlets — plus administrative boundaries
// (which is how Nominatim ranks the canonical city entry: e.g. Terrassa city
// comes back as class=boundary, type=administrative). Reject POIs (shops,
// cafes, hotels…) so "Terassa" typed by mistake doesn't pin the marker on a
// bakery in Mallorca instead of failing cleanly.
const PLACE_TYPES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'municipality',
  'suburb',
  'neighbourhood',
  'quarter',
  'locality',
  'island',
  'islet',
]);

function isPopulatedPlace(r: NominatimResult): boolean {
  if (r.class === 'place' && r.type && PLACE_TYPES.has(r.type)) return true;
  if (r.class === 'boundary' && r.type === 'administrative') return true;
  return false;
}

interface Props {
  value: CityResult;
  onSelect: (city: CityResult) => void;
  /** Set on the inner `<input>` so a parent `<Field htmlFor>` can bind. */
  inputId?: string;
}

// Nominatim usage policy — keep request volume modest. 500 ms debounce +
// 3-char minimum is gentler than typing-speed bursts while still feeling
// reactive at a touch keyboard.
const SEARCH_DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

export function CityAutocomplete({ value, onSelect, inputId }: Props) {
  const t = useT();
  const [query, setQuery] = useState(value.label);
  const [results, setResults] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [lastValueLabel, setLastValueLabel] = useState(value.label);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqIdRef = useRef(0);
  const listboxId = useId();
  const statusId = useId();

  // Floating dropdown that flips up/down depending on available space and
  // shrinks to fit the viewport — replaces the hard-coded `bottom-full`
  // placement that ran off-screen when the input sat near the viewport top.
  const {
    refs: { setReference, setFloating },
    floatingStyles,
  } = useFloating({
    open,
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, rects, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(availableHeight, 224)}px`,
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // React docs "Adjusting state on prop change" pattern — render-time setState,
  // bounded by the lastValueLabel guard so it can't loop. Replaces a
  // setState-in-effect that suffered from cascading renders.
  if (value.label !== lastValueLabel) {
    setLastValueLabel(value.label);
    if (!isFocused) {
      setQuery(value.label);
      setResults([]);
      setOpen(false);
      setLoading(false);
      setErrorMsg(null);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH || trimmed === value.label) return;
    const id = ++reqIdRef.current;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('format', 'json');
        // Bumped from 8 to 10 to leave headroom for `isPopulatedPlace`,
        // which can drop several POI/road/junction results per query.
        url.searchParams.set('limit', '10');
        url.searchParams.set('accept-language', t.cityAutocomplete.nominatimLang);
        // Needed to read class/type (for the place filter) and address.state
        // (for the disambiguation suffix in the dropdown).
        url.searchParams.set('addressdetails', '1');
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (id !== reqIdRef.current) return;
        if (!res.ok) {
          setResults([]);
          setOpen(false);
          setErrorMsg(
            res.status === 429
              ? t.cityAutocomplete.errorRateLimit
              : t.cityAutocomplete.errorService,
          );
          return;
        }
        const raw: unknown = await res.json();
        // Nominatim is a public, untyped endpoint — validate every record,
        // drop entries with non-finite coordinates so the rest of the
        // pipeline (Intl, Cesium, tz-lookup) never receives NaN, and keep
        // only populated places (see `isPopulatedPlace`).
        const data: NominatimResult[] = Array.isArray(raw)
          ? raw.filter(isNominatimResult).filter(isPopulatedPlace)
          : [];
        const cities = data.flatMap<CityResult>(r => {
          const lat = parseFloat(r.lat);
          const lon = parseFloat(r.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
          return [{
            label: buildLabel(r),
            lat,
            lon,
            timezone: timezoneFromLatLon(lat, lon),
          }];
        });
        setResults(cities);
        setHighlighted(0);
        setOpen(true);
        setErrorMsg(null);
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (id !== reqIdRef.current) return;
        setResults([]);
        setOpen(false);
        setErrorMsg(t.cityAutocomplete.errorNetwork);
      } finally {
        if (id === reqIdRef.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value.label, t]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const select = (city: CityResult) => {
    setQuery(city.label);
    setOpen(false);
    setResults([]);
    onSelect(city);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(results[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const onBlur = () => {
    setIsFocused(false);
    if (query.trim() !== value.label) setQuery(value.label);
  };

  return (
    <div ref={(el) => { wrapRef.current = el; setReference(el); }} className="relative">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={query}
        placeholder={t.natalForm.placePlaceholder}
        onChange={e => {
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          setErrorMsg(null);
          const trimmed = next.trim();
          if (trimmed.length < MIN_QUERY_LENGTH || trimmed === value.label) {
            setResults([]);
            setLoading(false);
          } else {
            setLoading(true);
          }
        }}
        onFocus={(e) => {
          setIsFocused(true);
          // Select-all on focus so the user can start typing immediately
          // instead of having to clear the geolocation "Position actuelle"
          // (or any previous city) by hand — especially fiddly on mobile.
          e.currentTarget.select();
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="cockpit-input w-full"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        inputMode="search"
        enterKeyHint="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
        aria-controls={listboxId}
        aria-describedby={errorMsg ? statusId : undefined}
        aria-invalid={errorMsg ? true : undefined}
      />
      {loading && (
        <span
          aria-hidden
          className="absolute right-2 top-1/2 -translate-y-1/2
                     text-cockpit-sm text-accent-label/70 animate-shimmer"
        >
          ✦
        </span>
      )}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        className={
          errorMsg
            ? 'mt-1 text-cockpit-xs tracking-cockpit-label text-rose-300/90'
            : 'sr-only'
        }
      >
        {errorMsg ?? ''}
      </div>
      {open && results.length > 0 && (
        <FloatingPortal>
          <ul
            ref={setFloating}
            id={listboxId}
            role="listbox"
            style={floatingStyles}
            className="z-50 overflow-y-auto rounded-sm
                       border border-border-control bg-surface/95
                       backdrop-blur-sm text-cockpit-md text-slate-200
                       shadow-cockpit-lift"
          >
            {results.map((r, i) => (
              <li
                key={`${r.lat},${r.lon},${i}`}
                role="option"
                aria-selected={i === highlighted}
                onMouseDown={e => { e.preventDefault(); select(r); }}
                onMouseEnter={() => setHighlighted(i)}
                className={`px-3 py-2.5 cursor-pointer truncate transition-colors min-h-11 flex items-center
                  ${i === highlighted
                    ? 'bg-violet-600/25 text-violet-100'
                    : 'hover:bg-violet-600/15'}`}
              >
                {r.label}
              </li>
            ))}
          </ul>
        </FloatingPortal>
      )}
    </div>
  );
}

/**
 * Build a compact, disambiguating label: "place, region, country" when the
 * region is known, falling back to "place, country", with `display_name` as
 * a last resort. Including the region lets users tell apart genuine
 * homonyms (e.g. Valencia in Comunidad Valenciana vs. Valencia in Venezuela)
 * without drowning the dropdown in Nominatim's full verbose path.
 */
function buildLabel(r: NominatimResult): string {
  const addr = r.address;
  const place =
    addr?.city ??
    addr?.town ??
    addr?.village ??
    addr?.hamlet ??
    addr?.municipality ??
    r.display_name.split(',')[0]?.trim() ??
    r.display_name;
  const region = addr?.state ?? addr?.region;
  const country = addr?.country;
  return [place, region, country].filter(Boolean).join(', ');
}
