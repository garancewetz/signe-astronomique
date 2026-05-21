import { type SVGProps, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Info, Mail, X } from 'lucide-react';

function GithubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54 0-.27-.01-1.16-.02-2.1-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.55 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.99 0 0 .94-.3 3.09 1.15.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.15-1.45 3.09-1.15 3.09-1.15.61 1.56.23 2.71.11 2.99.72.79 1.16 1.79 1.16 3.02 0 4.31-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.78.54 4.46-1.49 7.68-5.7 7.68-10.67C23.25 5.48 18.27.5 12 .5z" />
    </svg>
  );
}
import { usePortalTarget } from '@/hooks/usePortalTarget';
import { useT } from '@/context/useLocale';
import { cn, surfaceClasses } from '@/components/ui';

const CONTACT_EMAIL = 'garance.wetzel@gmail.com';

interface Props {
  onClose: () => void;
}

export function ExploreSpacePopover({ onClose }: Props) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const portalTarget = usePortalTarget();
  const [emailCopied, setEmailCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = CONTACT_EMAIL;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setEmailCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setEmailCopied(false), 1800);
    } catch {
      // Clipboard access denied — keep state unchanged
    }
  };

  if (!portalTarget) return null;
  return createPortal(
    <motion.div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overflow-x-hidden overscroll-contain
                 p-4
                 pt-[max(1rem,env(safe-area-inset-top,0px))]
                 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <button
        type="button"
        aria-label={t.panels.explore.closeAriaLabel}
        className="fixed inset-0 z-0 bg-overlay/75 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="explore-space-title"
        className={cn(
          'relative z-10 w-[min(34rem,calc(100vw-2rem))] min-h-0 min-w-0',
          'max-h-[min(75vh,32rem,calc(100svh-2rem))]',
          'flex flex-col rounded-panel overflow-hidden',
          surfaceClasses('sheet'),
        )}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-border-hud-muted">
          <div>
            <div
              id="explore-space-title"
              className="text-cockpit-lg tracking-cockpit-label text-accent-label"
            >
              {t.exploreSpace.title}
            </div>
            <p className="text-cockpit-sm text-slate-500 mt-1 leading-snug">
              {t.exploreSpace.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cockpit-focus shrink-0 inline-flex items-center gap-2 h-9 px-2.5 rounded-panel border border-border-hud-subtle
                       text-slate-400 hover:text-white hover:bg-violet-500/15 transition text-cockpit-sm tracking-cockpit-wide"
            aria-label={t.exploreSpace.closeAriaLabel}
          >
            <X className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden />
            <span>{t.exploreSpace.closeLabel}</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-5">
          {t.exploreSpace.sections.map((section) => (
            <section key={section.title}>
              <h3 className="text-cockpit-xs tracking-cockpit-hud text-accent-label/75 mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-2 text-cockpit-md leading-snug text-slate-300
                                 hover:text-violet-200 transition-colors"
                    >
                      <span className="text-violet-500/80 group-hover:text-violet-400 shrink-0 mt-0.5">
                        ↗
                      </span>
                      <span className="min-w-0 wrap-break-word underline decoration-violet-500/25 underline-offset-2 group-hover:decoration-violet-400/50">
                        {link.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer
          className="shrink-0 flex items-center justify-between gap-3
                     px-4 py-2.5 border-t border-border-hud-muted"
        >
          <span className="text-cockpit-xs tracking-cockpit-hud uppercase text-slate-500">
            {t.exploreSpace.footerCredit}
          </span>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/garancewetz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.exploreSpace.githubAriaLabel}
              className="cockpit-focus grid place-items-center
                         size-8 rounded
                         text-slate-400 hover:text-violet-200
                         hover:bg-violet-500/10 transition-colors"
            >
              <GithubMark className="size-4" />
            </a>
            <button
              type="button"
              onClick={handleCopyEmail}
              aria-label={
                emailCopied
                  ? t.exploreSpace.emailCopiedAriaLabel(CONTACT_EMAIL)
                  : t.exploreSpace.emailCopyAriaLabel(CONTACT_EMAIL)
              }
              title={emailCopied ? t.exploreSpace.emailCopiedTitle : t.exploreSpace.emailCopyTitle(CONTACT_EMAIL)}
              className="cockpit-focus relative grid place-items-center
                         size-8 rounded
                         text-slate-400 hover:text-violet-200
                         hover:bg-violet-500/10 transition-colors"
            >
              {emailCopied ? (
                <Check
                  className="size-4 text-violet-300"
                  strokeWidth={1.6}
                  aria-hidden
                />
              ) : (
                <Mail className="size-4" strokeWidth={1.4} aria-hidden />
              )}
              {emailCopied && (
                <span
                  role="status"
                  className="pointer-events-none absolute bottom-full right-0 mb-1.5
                             whitespace-nowrap rounded border border-border-hud-subtle
                             bg-surface-raised/95 px-1.5 py-0.5
                             text-cockpit-xs tracking-cockpit-hud uppercase text-violet-200
                             shadow-cockpit-sheet"
                >
                  {t.exploreSpace.emailCopiedBadge}
                </span>
              )}
            </button>
          </div>
        </footer>
      </div>
    </motion.div>,
    portalTarget,
  );
}

export function InfoCircleIcon() {
  return <Info className="size-[18px] shrink-0" strokeWidth={1.35} aria-hidden />;
}
