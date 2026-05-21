import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Download,
  FileDown,
  List,
  Loader2,
} from 'lucide-react';
import { InfoCircleIcon } from '@/features/natal-report';
import { cn, MenuRow, surfaceClasses } from '../ui';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useLocale, useT } from '../../context/useLocale';
import { LOCALES, type Locale } from '../../i18n';

interface MobileSystemDrawerProps {
  open: boolean;
  onClose: () => void;

  onOpenLegend: () => void;
  onOpenExploreSpace: () => void;

  onExportView: () => void;
  exportingView: boolean;
  onExportPdf: () => void;
  exportingPdf: boolean;
  canExportReport: boolean;
}

/**
 * Pop-down system menu anchored under the top chip's "⋮" button. Hosts
 * the rarely-used controls that don't deserve a dedicated tab on mobile:
 * legend · external links · two PNG exports.
 *
 * A backdrop swallows outside clicks so the drawer dismisses naturally.
 */
export function MobileSystemDrawer({
  open,
  onClose,
  onOpenLegend,
  onOpenExploreSpace,
  onExportView,
  exportingView,
  onExportPdf,
  exportingPdf,
  canExportReport,
}: MobileSystemDrawerProps) {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const reduceMotion = useReducedMotion();
  const drawerRef = useFocusTrap<HTMLDivElement>(open);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="system-drawer-backdrop"
            type="button"
            aria-label={t.mobile.systemDrawer.backdropAriaLabel}
            className="fixed inset-0 z-40 bg-overlay/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            onClick={onClose}
          />
          <motion.div
            key="system-drawer-panel"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.mobile.systemDrawer.ariaLabel}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className={cn(
              'fixed top-[calc(3rem+env(safe-area-inset-top,0))] right-2 z-50',
              'w-[min(18rem,calc(100vw-1rem))]',
              'rounded-panel overflow-hidden',
              surfaceClasses('panel'),
            )}
            style={{ transformOrigin: 'top right' }}
          >
            <ul role="list" className="p-1">
              <li>
                <div className="px-2 py-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex flex-col leading-tight">
                    <span className="text-cockpit-sm text-slate-100 font-medium truncate">
                      {t.mobile.systemDrawer.language.label}
                    </span>
                    <span className="text-cockpit-xs text-slate-500 truncate">
                      {t.mobile.systemDrawer.language.sublabel}
                    </span>
                  </div>
                  <div
                    role="group"
                    aria-label={t.languageSwitcher.ariaLabel}
                    className={cn(
                      'inline-flex items-stretch rounded shrink-0',
                      'border border-border-hud-faint bg-surface-console/55',
                      'overflow-hidden text-cockpit-xs tracking-cockpit-label uppercase font-mono',
                    )}
                  >
                    {LOCALES.map((option, idx) => {
                      const active = option === locale;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setLocale(option as Locale)}
                          className={cn(
                            'cockpit-focus px-2 py-1 leading-none transition-colors',
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
                </div>
              </li>
              <DrawerDivider />
              <li>
                <MenuRow
                  size="md"
                  label={t.mobile.systemDrawer.legend.label}
                  sublabel={t.mobile.systemDrawer.legend.sublabel}
                  icon={<List className="size-4" strokeWidth={1.4} aria-hidden />}
                  onClick={() => {
                    onClose();
                    onOpenLegend();
                  }}
                />
              </li>
              <li>
                <MenuRow
                  size="md"
                  label={t.mobile.systemDrawer.explore.label}
                  sublabel={t.mobile.systemDrawer.explore.sublabel}
                  icon={<InfoCircleIcon />}
                  onClick={() => {
                    onClose();
                    onOpenExploreSpace();
                  }}
                />
              </li>
              <DrawerDivider />
              <li>
                <MenuRow
                  size="md"
                  label={t.mobile.systemDrawer.exportView.label}
                  sublabel={t.mobile.systemDrawer.exportView.sublabel}
                  icon={
                    exportingView ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <Download className="size-4" strokeWidth={1.4} aria-hidden />
                    )
                  }
                  disabled={exportingView}
                  onClick={onExportView}
                />
              </li>
              <li>
                <MenuRow
                  size="md"
                  label={t.mobile.systemDrawer.exportReport.label}
                  sublabel={
                    canExportReport
                      ? t.mobile.systemDrawer.exportReport.sublabelReady
                      : t.mobile.systemDrawer.exportReport.sublabelLocked
                  }
                  icon={
                    exportingPdf ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <FileDown className="size-4" strokeWidth={1.4} aria-hidden />
                    )
                  }
                  disabled={!canExportReport || exportingPdf}
                  onClick={onExportPdf}
                />
              </li>
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerDivider() {
  return <li aria-hidden="true" className="my-1 mx-2 h-px bg-border-hud-faint" />;
}
