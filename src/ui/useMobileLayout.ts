import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 767px), (pointer: coarse) and (max-width: 1023px)';

function readMatch(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * Returns true on phones and small touch tablets in portrait. The desktop
 * cockpit is dense and built around hover/keyboard; the mobile layout is a
 * separate composition (full-screen canvas + bottom sheet + tab bar).
 *
 * The query mixes a width and a pointer test so a touchscreen laptop docked
 * to an external monitor stays on the desktop layout.
 */
export function useMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => readMatch());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
