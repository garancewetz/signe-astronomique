/**
 * Window events between the static welcome card (#seo-splash, wired in
 * main.tsx) and the birth form React renders inside it (WelcomeForm).
 */
export const WELCOME_EVENTS = {
  /** React → card: a sign was computed, fade the card out. */
  dismiss: 'seo-splash:dismiss',
  /** Card → React: the card left the DOM, drop the portal. */
  removed: 'seo-splash:removed',
  /** React → card (desktop): show it on demand, from the header's "Pourquoi ?". */
  open: 'seo-splash:open',
} as const;
