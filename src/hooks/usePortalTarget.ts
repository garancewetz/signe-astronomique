import { useEffect, useState } from 'react';

/**
 * Returns the right DOM node to portal floating UI into. Defaults to
 * `document.body`, but switches to `document.fullscreenElement` while a
 * fullscreen subtree is active — otherwise portaled overlays stay outside
 * the fullscreen element and the browser hides them.
 */
export function usePortalTarget(): Element | null {
  const [target, setTarget] = useState<Element | null>(() =>
    typeof document === 'undefined'
      ? null
      : document.fullscreenElement ?? document.body,
  );

  useEffect(() => {
    const update = () => setTarget(document.fullscreenElement ?? document.body);
    update();
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  return target;
}
