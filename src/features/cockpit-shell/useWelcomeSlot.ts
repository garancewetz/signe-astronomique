import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n';
import { useLocale } from '@/context/useLocale';
import { WELCOME_EVENTS } from './welcomeEvents';

/**
 * The welcome card's form slot while the card is on screen, null once it
 * is gone. Also keeps the card's FR/EN toggle and the app locale in sync.
 */
export function useWelcomeSlot(): HTMLElement | null {
  const { setLocale } = useLocale();
  const [target, setTarget] = useState<HTMLElement | null>(
    () => document.getElementById('seo-splash-form'),
  );

  useEffect(() => {
    if (!target) return;
    // Hides the card's static CTA, which only pointed at the sidebar form.
    const card = document.getElementById('seo-splash');
    card?.classList.add('seo-splash--has-form');
    const onRemoved = () => setTarget(null);
    const onLang = (e: Event) => setLocale((e as CustomEvent<Locale>).detail);
    window.addEventListener(WELCOME_EVENTS.removed, onRemoved);
    window.addEventListener(WELCOME_EVENTS.lang, onLang);
    return () => {
      card?.classList.remove('seo-splash--has-form');
      window.removeEventListener(WELCOME_EVENTS.removed, onRemoved);
      window.removeEventListener(WELCOME_EVENTS.lang, onLang);
    };
  }, [target, setLocale]);

  return target;
}
