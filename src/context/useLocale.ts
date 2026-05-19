import { useContext } from 'react';
import type { Copy } from '../i18n';
import {
  LocaleCtx,
  type LocaleContextValue,
} from './localeContextInternal';

export function useLocale(): LocaleContextValue {
  const v = useContext(LocaleCtx);
  if (!v) {
    throw new Error('useLocale must be called inside <LocaleProvider>');
  }
  return v;
}

/** Shorthand for the active dictionary. */
export function useT(): Copy {
  return useLocale().t;
}
