import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Download,
  FileText,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { InfoCircleIcon } from '../ExploreSpacePopover';
import { cn } from '../ui';

interface MobileSystemDrawerProps {
  open: boolean;
  onClose: () => void;

  audioEnabled: boolean;
  onToggleAudio: () => void;

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
 * audio · fullscreen · legend · external links · two PNG exports.
 *
 * A backdrop swallows outside clicks so the drawer dismisses naturally.
 */
export function MobileSystemDrawer({
  open,
  onClose,
  audioEnabled,
  onToggleAudio,
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
            className="fixed top-12 right-2 z-50
                       w-[min(18rem,calc(100vw-1rem))]
                       bg-surface-raised/95 backdrop-blur-2xl
                       border border-border-control rounded-panel
                       shadow-cockpit-panel
                       overflow-hidden"
            style={{ transformOrigin: 'top right' }}
          >
            <ul role="list" className="p-1">
              <DrawerToggle
                label={audioEnabled ? 'Couper le son' : 'Activer le son'}
                icon={
                  audioEnabled ? (
                    <Volume2 className="size-4" strokeWidth={1.4} aria-hidden />
                  ) : (
                    <VolumeX className="size-4" strokeWidth={1.4} aria-hidden />
                  )
                }
                active={audioEnabled}
                onClick={onToggleAudio}
              />
              <DrawerToggle
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
              <DrawerDivider />
              <DrawerAction
                label="Légende"
                sublabel="Symboles · couleurs · calques"
                icon={<List className="size-4" strokeWidth={1.4} aria-hidden />}
                onClick={() => {
                  onClose();
                  onOpenLegend();
                }}
              />
              <DrawerAction
                label="Liens utiles"
                sublabel="Cartes du ciel · éphémérides"
                icon={<InfoCircleIcon />}
                onClick={() => {
                  onClose();
                  onOpenExploreSpace();
                }}
              />
              <DrawerDivider />
              <DrawerAction
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
              <DrawerAction
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
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface RowProps {
  label: string;
  sublabel?: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function DrawerToggle({ label, icon, active = false, onClick }: RowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          'cockpit-focus relative w-full',
          'flex items-center gap-3 min-h-11 px-3 py-2 rounded',
          'transition-colors',
          active
            ? 'text-cyan-100 bg-cyan-400/10'
            : 'text-slate-200/90 hover:text-slate-50 hover:bg-violet-500/10',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 grid place-items-center w-5',
            active ? 'text-cyan-200' : 'text-slate-300/85',
          )}
        >
          {icon}
        </span>
        <span className="flex-1 text-left text-cockpit-md tracking-tight truncate">
          {label}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 relative inline-block w-9 h-4 rounded-full transition-colors',
            active ? 'bg-cyan-400/60' : 'bg-slate-600/45',
          )}
        >
          <span
            className={cn(
              'absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-white shadow transition-[left]',
              active ? 'left-[calc(100%-0.75rem-1px)]' : 'left-px',
            )}
          />
        </span>
      </button>
    </li>
  );
}

function DrawerAction({ label, sublabel, icon, disabled = false, onClick }: RowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="cockpit-focus w-full
                   flex items-center gap-3 min-h-11 px-3 py-2 rounded
                   text-slate-200/90 hover:text-slate-50 hover:bg-violet-500/10
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors"
      >
        <span aria-hidden="true" className="shrink-0 grid place-items-center w-5 text-slate-300/85">
          {icon}
        </span>
        <span className="flex-1 min-w-0 text-left">
          <span className="block truncate text-cockpit-md tracking-tight">{label}</span>
          {sublabel && (
            <span className="block truncate text-cockpit-xs tracking-cockpit-tight uppercase text-slate-500">
              {sublabel}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function DrawerDivider() {
  return <li aria-hidden="true" className="my-1 mx-2 h-px bg-border-hud-faint" />;
}
