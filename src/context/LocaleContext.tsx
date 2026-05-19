import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { COPY, type Locale } from '../i18n';
import {
  LocaleCtx,
  LOCALE_STORAGE_KEY,
  type LocaleContextValue,
} from './localeContextInternal';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'fr';
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    // localStorage can throw in private mode; fall back to default.
  }
  return 'fr';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Ignore storage failures — the in-memory state is the source of truth.
    }
    document.documentElement.lang = COPY[locale].htmlLang;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: COPY[locale] }),
    [locale, setLocale],
  );

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}
