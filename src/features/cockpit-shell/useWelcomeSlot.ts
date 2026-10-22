import { useEffect, useState } from 'react';
import { WELCOME_EVENTS } from './welcomeEvents';

/**
 * The welcome card's form slot while the card is on screen and `enabled`,
 * null otherwise.
 *
 * Desktop passes `enabled: false`: the sidebar form is already in view, so
 * the card keeps its CTA (which points at that form) instead of a second
 * copy that would leave the sidebar empty and jump on close.
 */
export function useWelcomeSlot(enabled: boolean): HTMLElement | null {
  const [slot, setSlot] = useState<HTMLElement | null>(
    () => document.getElementById('seo-splash-form'),
  );

  useEffect(() => {
    if (!slot) return;
    const onRemoved = () => setSlot(null);
    window.addEventListener(WELCOME_EVENTS.removed, onRemoved);
    return () => {
      window.removeEventListener(WELCOME_EVENTS.removed, onRemoved);
    };
  }, [slot]);

  useEffect(() => {
    if (!enabled || !slot) return;
    // Hides the card's static CTA, which only points at the sidebar form.
    const card = document.getElementById('seo-splash');
    card?.classList.add('seo-splash--has-form');
    return () => card?.classList.remove('seo-splash--has-form');
  }, [enabled, slot]);

  return enabled ? slot : null;
}
