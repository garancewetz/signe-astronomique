import { useEffect } from 'react';

/**
 * Locks `document.body` scroll while `active` is true. Restores the previous
 * inline `overflow` value on cleanup so coexisting locks compose correctly
 * (only the last unlock visibly releases).
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
