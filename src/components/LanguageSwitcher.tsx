import { useLocale } from '../context/useLocale';
import type { Locale } from '../i18n';
import { LOCALES } from '../i18n';
import { cn } from './ui/cn';

/**
 * Two-state FR | EN toggle anchored in the sidebar header (desktop) and
 * exposed as a menu row on mobile (via MobileSystemDrawer). The switcher
 * mutates LocaleContext, which fans out to every `useT()` consumer.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div
      role="group"
      aria-label={t.languageSwitcher.ariaLabel}
      className={cn(
        'inline-flex items-stretch rounded',
        'border border-border-hud-faint bg-surface-console/55',
        'overflow-hidden text-cockpit-xs tracking-cockpit-label uppercase',
        'font-mono',
      )}
    >
      {LOCALES.map((option, idx) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(option)}
            className={cn(
              'cockpit-focus px-1.5 py-0.5 leading-none',
              'transition-colors',
              idx > 0 && 'border-l border-border-hud-faint',
              active
                ? 'bg-violet-500/20 text-violet-50'
                : 'text-slate-400 hover:text-slate-100 hover:bg-violet-500/10',
            )}
          >
            {t.languageSwitcher.shortOptions[option as Locale]}
          </button>
        );
      })}
    </div>
  );
}
