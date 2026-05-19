import { createContext } from 'react';
import type { Copy, Locale } from '../i18n';

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Copy;
}

export const LocaleCtx = createContext<LocaleContextValue | null>(null);

export const LOCALE_STORAGE_KEY = 'truecosmicsign.locale';
