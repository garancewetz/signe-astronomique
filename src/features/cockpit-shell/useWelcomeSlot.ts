import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n';
import { useLocale } from '@/context/useLocale';
import { WELCOME_EVENTS } from './welcomeEvents';

/**
 * The welcome card's form slot while the card is on screen and `enabled`,
 * null otherwise. Also keeps the card's FR/EN toggle and the app locale in
 * sync, whether or not the form is hosted in the card.
 *
 * Desktop passes `enabled: false`: the sidebar form is already in view, so
 * the card keeps its CTA (which points at that form) instead of a second
 * copy that would leave the sidebar empty and jump on close.
 */
export function useWelcomeSlot(enabled: boolean): HTMLElement | null {
  const { setLocale } = useLocale();
  const [slot, setSlot] = useState<HTMLElement | null>(
    () => document.getElementById('seo-splash-form'),
  );

  useEffect(() => {
    if (!slot) return;
    const onRemoved = () => setSlot(null);
    const onLang = (e: Event) => setLocale((e as CustomEvent<Locale>).detail);
    window.addEventListener(WELCOME_EVENTS.removed, onRemoved);
    window.addEventListener(WELCOME_EVENTS.lang, onLang);
    return () => {
      window.removeEventListener(WELCOME_EVENTS.removed, onRemoved);
      window.removeEventListener(WELCOME_EVENTS.lang, onLang);
    };
  }, [slot, setLocale]);

  useEffect(() => {
    if (!enabled || !slot) return;
    // Hides the card's static CTA, which only points at the sidebar form.
    const card = document.getElementById('seo-splash');
    card?.classList.add('seo-splash--has-form');
    return () => card?.classList.remove('seo-splash--has-form');
  }, [enabled, slot]);

  return enabled ? slot : null;
}
