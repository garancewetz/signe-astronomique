import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Download, Share, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button, IconButton, cn } from '@/ui';
import { useT } from '@/context/useLocale';

/**
 * Chrome's `beforeinstallprompt` event isn't in the standard DOM lib.
 * Typed locally so we can drive the deferred install on Android/Chromium
 * without `any` casts at the call sites.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'tcs:install-prompt:v1';
// Delay surfacing the prompt so it doesn't fight the first-paint reveal of
// the 3D scene. By the time it appears, the user has had a moment to take
// in the cockpit and a CTA stops feeling like a popup ambush.
const REVEAL_DELAY_MS = 8000;

type Mode = 'android' | 'ios';

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ identifies as Mac — corroborate with touch points so we
  // don't catch every desktop Safari user.
  const isIPhone = /iPhone|iPod/.test(ua);
  const isIPad =
    /iPad/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  return isIPhone || isIPad;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS exposes its own standalone bit outside the media-query spec.
  return (
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage may be unavailable in privacy modes — the prompt will simply
    // reappear next session, which is an acceptable degradation.
  }
}

/**
 * Mobile-only install hint. On Android/Chromium it captures the
 * `beforeinstallprompt` event and exposes an "Install" CTA; on iOS Safari,
 * which has no programmatic install API, it surfaces the Share → Add to
 * Home Screen gesture as instructional text. Dismissed permanently via
 * localStorage so we never nag.
 */
export function InstallPwaPrompt() {
  const t = useT();
  const reduceMotion = useReducedMotion();
  // iOS has no install event — detect it synchronously so the effect
  // doesn't have to setState in its body (which the project's lint rules
  // flag as a cascading-render anti-pattern). Android upgrades mode later
  // when `beforeinstallprompt` fires.
  const [mode, setMode] = useState<Mode | null>(() => {
    if (typeof window === 'undefined') return null;
    if (isStandalone() || readDismissed()) return null;
    return detectIos() ? 'ios' : null;
  });
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone() || readDismissed()) return;

    let iosTimer: number | undefined;
    let androidTimer: number | undefined;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode('android');
      androidTimer = window.setTimeout(() => setOpen(true), REVEAL_DELAY_MS);
    };

    const onAppInstalled = () => {
      writeDismissed();
      setOpen(false);
    };

    window.addEventListener(
      'beforeinstallprompt',
      onBeforeInstallPrompt as EventListener,
    );
    window.addEventListener('appinstalled', onAppInstalled);

    if (detectIos()) {
      iosTimer = window.setTimeout(() => setOpen(true), REVEAL_DELAY_MS);
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        onBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener('appinstalled', onAppInstalled);
      if (iosTimer != null) window.clearTimeout(iosTimer);
      if (androidTimer != null) window.clearTimeout(androidTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    writeDismissed();
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      writeDismissed();
    }
    setDeferred(null);
    setOpen(false);
  }, [deferred]);

  if (!mode) return null;

  const copy = t.installPwa[mode];
  const Icon = mode === 'android' ? Download : Share;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="install-pwa"
          role="dialog"
          aria-label={t.installPwa.ariaLabel}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
          className={cn(
            // Pinned just under the mobile header bar; the cockpit shell is
            // `fixed inset-0`, so `fixed` here aligns to the viewport edge
            // and clears the safe-area + header (44px) on iOS.
            'fixed left-2 right-2 z-30',
            'top-[calc(env(safe-area-inset-top,0)+3.25rem)]',
            'rounded-md border border-border-hud-subtle',
            'bg-surface-raised/95 backdrop-blur-xl shadow-cockpit-panel',
            'p-3 flex items-start gap-3',
          )}
        >
          <div
            aria-hidden
            className="shrink-0 size-9 grid place-items-center rounded-md border border-border-control bg-violet-500/15"
          >
            <Icon className="size-4 text-violet-200" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cockpit-sm tracking-cockpit-hud uppercase text-accent-title">
              {copy.title}
            </p>
            <p className="mt-0.5 text-cockpit-xs text-slate-300 leading-snug">
              {copy.body}
            </p>
            {mode === 'android' && (
              <div className="mt-2">
                <Button variant="solid" size="sm" onClick={install}>
                  {t.installPwa.android.cta}
                </Button>
              </div>
            )}
          </div>
          <IconButton
            onClick={dismiss}
            aria-label={t.installPwa.dismissAriaLabel}
            className="shrink-0"
          >
            <X className="size-3.5" strokeWidth={1.5} aria-hidden />
          </IconButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
