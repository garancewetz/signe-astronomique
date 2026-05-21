import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => !el.hasAttribute('inert') && el.offsetParent !== null);
}

/**
 * Returns a ref to attach to the dialog container. While `active` is true:
 *   1. The previously focused element is remembered.
 *   2. Tab / Shift+Tab cycle inside the container.
 *   3. On deactivate or unmount, focus returns to the remembered element.
 *
 * The first focus inside the container is left to the caller — `AnalysisModal`
 * already focuses its close button on open, and we don't want to fight that.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active: boolean,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = focusableWithin(container);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !container.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      // Defer one frame so the dialog has fully unmounted before we move
      // focus back — otherwise the browser may scroll to a node mid-exit.
      if (target && typeof target.focus === 'function') {
        requestAnimationFrame(() => target.focus({ preventScroll: true }));
      }
    };
  }, [active]);

  return ref;
}
