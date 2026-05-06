import { useEffect, useId, useRef, useState } from 'react';
import { timezoneFromLatLon } from '../utils/timezone';

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
}

export function CityAutocomplete({ value, onSelect }: Props) {
  const [query, setQuery] = useState(value.label);
  const [results, setResults] = useState<CityResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reqIdRef = useRef(0);
  const listboxId = useId();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === value.label) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = ++reqIdRef.current;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '8');
        url.searchParams.set('accept-language', 'fr');
        const res = await fetch(url.toString());
        if (id !== reqIdRef.current) return;
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
      } catch {
        // Silent — Nominatim may rate-limit; user can keep typing.
      } finally {
        if (id === reqIdRef.current) setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, value.label]);

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
    if (query.trim() !== value.label) setQuery(value.label);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={query}
        placeholder="Ville de naissance…"
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="cockpit-input w-full"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
        aria-controls={listboxId}
      />
      {loading && (
        <span
          aria-hidden
          className="absolute right-2 top-1/2 -translate-y-1/2
                     text-[10px] text-violet-300/70 animate-shimmer"
        >
          ✦
        </span>
      )}
      {open && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 left-0 right-0 bottom-full mb-1
                     max-h-56 overflow-y-auto rounded-sm
                     border border-violet-400/30 bg-[#0d0820]/95
                     backdrop-blur-sm text-[11px] text-slate-200
                     shadow-[0_-10px_30px_rgba(0,0,0,0.55)]"
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
