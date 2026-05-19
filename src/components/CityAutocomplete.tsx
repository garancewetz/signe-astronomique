import { useEffect, useId, useRef, useState } from 'react';
import { timezoneFromLatLon } from '../utils/timezone';
import { useT } from '../context/useLocale';

export interface CityResult {
  label: string;
  lat: number;
  lon: number;
  timezone: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
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
        url.searchParams.set('limit', '8');
        url.searchParams.set('accept-language', t.cityAutocomplete.nominatimLang);
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
        const data = (await res.json()) as NominatimResult[];
        const cities = data.map<CityResult>(r => {
          const lat = parseFloat(r.lat);
          const lon = parseFloat(r.lon);
          return {
            label: shorten(r.display_name),
            lat,
            lon,
            timezone: timezoneFromLatLon(lat, lon),
          };
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
    <div ref={wrapRef} className="relative">
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
        onFocus={() => {
          setIsFocused(true);
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="cockpit-input w-full"
        autoComplete="off"
        spellCheck={false}
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
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 left-0 right-0 bottom-full mb-1
                     max-h-56 overflow-y-auto rounded-sm
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
      )}
    </div>
  );
}

/**
 * Nominatim's display_name is often verbose ("Paris, Île-de-France,
 * France métropolitaine, France"). Keep the first segment + country.
 */
function shorten(displayName: string): string {
  const parts = displayName.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length <= 2) return parts.join(', ');
  return `${parts[0]}, ${parts[parts.length - 1]}`;
}
