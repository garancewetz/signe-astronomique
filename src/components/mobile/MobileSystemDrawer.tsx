import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Download,
  FileText,
  List,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { InfoCircleIcon } from '../ExploreSpacePopover';
import { cn, MenuRow, surfaceClasses } from '../ui';

interface MobileSystemDrawerProps {
  open: boolean;
  onClose: () => void;

  fullscreenActive: boolean;
  onToggleFullscreen: () => void;

  onOpenLegend: () => void;
  onOpenExploreSpace: () => void;

  onExportView: () => void;
  exportingView: boolean;
  onExportReport: () => void;
  exportingReport: boolean;
  canExportReport: boolean;
}

/**
 * Pop-down system menu anchored under the top chip's "⋮" button. Hosts
 * the rarely-used controls that don't deserve a dedicated tab on mobile:
 * fullscreen · legend · external links · two PNG exports.
 *
 * A backdrop swallows outside clicks so the drawer dismisses naturally.
 */
export function MobileSystemDrawer({
  open,
  onClose,
  fullscreenActive,
  onToggleFullscreen,
  onOpenLegend,
  onOpenExploreSpace,
  onExportView,
  exportingView,
  onExportReport,
  exportingReport,
  canExportReport,
}: MobileSystemDrawerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="system-drawer-backdrop"
            type="button"
            aria-label="Fermer le menu système"
            className="fixed inset-0 z-40 bg-overlay/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            onClick={onClose}
          />
          <motion.div
            key="system-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu système"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className={cn(
              'fixed top-12 right-2 z-50',
              'w-[min(18rem,calc(100vw-1rem))]',
              'rounded-panel overflow-hidden',
              surfaceClasses('panel'),
            )}
            style={{ transformOrigin: 'top right' }}
          >
            <ul role="list" className="p-1">
              <li>
                <MenuRow
                  kind="toggle"
                  size="md"
                  label={fullscreenActive ? 'Quitter le plein écran' : 'Plein écran'}
                  icon={
                    fullscreenActive ? (
                      <Minimize2 className="size-4" strokeWidth={1.4} aria-hidden />
                    ) : (
                      <Maximize2 className="size-4" strokeWidth={1.4} aria-hidden />
                    )
                  }
                  active={fullscreenActive}
                  onClick={onToggleFullscreen}
                />
              </li>
              <DrawerDivider />
              <li>
                <MenuRow
                  size="md"
                  label="Légende"
                  sublabel="Symboles · couleurs · calques"
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
                  label="Liens utiles"
                  sublabel="Cartes du ciel · éphémérides"
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
                  label="Exporter la vue"
                  sublabel="PNG du ciel 3D"
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
                  label="Exporter le rapport"
                  sublabel={
                    canExportReport
                      ? 'PNG vue + carte complète'
                      : 'Calcule d’abord ton ciel'
                  }
                  icon={
                    exportingReport ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <FileText className="size-4" strokeWidth={1.4} aria-hidden />
                    )
                  }
                  disabled={!canExportReport || exportingReport}
                  onClick={onExportReport}
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
