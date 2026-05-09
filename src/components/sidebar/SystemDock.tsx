import { useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
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
import { TooltipWrap } from '../Tooltip';
import { ExploreSpacePopover, InfoCircleIcon } from '../ExploreSpacePopover';
import { cn, IconButton, type IconButtonActiveTone } from '../ui';

interface SystemDockProps {
  collapsed: boolean;
  legendActive: boolean;
  onToggleLegend: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  fullscreenActive: boolean;
  onToggleFullscreen: () => void;
  onExportView: () => void;
  exportingView: boolean;
  onExportReport: () => void;
  exportingReport: boolean;
  canExportReport: boolean;
}

export function SystemDock({
  collapsed,
  legendActive,
  onToggleLegend,
  audioEnabled,
  onToggleAudio,
  fullscreenActive,
  onToggleFullscreen,
  onExportView,
  exportingView,
  onExportReport,
  exportingReport,
  canExportReport,
}: SystemDockProps) {
  const [exploreOpen, setExploreOpen] = useState(false);

  return (
    <>
      <footer
        role="group"
        aria-label="Système"
        className={cn(
          'shrink-0 border-t border-border-hud-faint',
          'pb-[env(safe-area-inset-bottom,0)]',
          collapsed
            ? 'flex flex-col items-center gap-1 py-2'
            : 'grid grid-cols-3 gap-1 px-2 py-2',
        )}
      >
        <SystemButton
          tooltip="Ressources externes : cartes du ciel, éphémérides…"
          ariaLabel="Ouvrir la liste de liens utiles"
          active={exploreOpen}
          activeTone="sky"
          onClick={() => setExploreOpen((v) => !v)}
        >
          <InfoCircleIcon />
        </SystemButton>
        <SystemButton
          tooltip="Légende — symboles, couleurs, calques"
          ariaLabel="Ouvrir la légende"
          active={legendActive}
          activeTone="sky"
          onClick={onToggleLegend}
        >
          <List className="size-4" strokeWidth={1.4} aria-hidden />
        </SystemButton>
        <SystemButton
          tooltip={fullscreenActive ? 'Quitter le plein écran' : 'Passer en plein écran'}
          ariaLabel={fullscreenActive ? 'Quitter le plein écran' : 'Passer en plein écran'}
          active={fullscreenActive}
          activeTone="sky"
          onClick={onToggleFullscreen}
        >
          {fullscreenActive ? (
            <Minimize2 className="size-4" strokeWidth={1.35} aria-hidden />
          ) : (
            <Maximize2 className="size-4" strokeWidth={1.35} aria-hidden />
          )}
        </SystemButton>
        <SystemButton
          tooltip={audioEnabled ? 'Couper le son' : 'Activer le son'}
          ariaLabel={audioEnabled ? 'Couper le son' : 'Activer le son'}
          active={audioEnabled}
          activeTone="emerald"
          onClick={onToggleAudio}
        >
          {audioEnabled ? (
            <Volume2 className="size-4" strokeWidth={1.35} aria-hidden />
          ) : (
            <VolumeX className="size-4" strokeWidth={1.35} aria-hidden />
          )}
        </SystemButton>
        <SystemButton
          tooltip="Enregistre la vue 3D actuelle dans un fichier image PNG"
          ariaLabel="Exporter la vue 3D en image PNG"
          onClick={onExportView}
          disabled={exportingView}
        >
          {exportingView ? (
            <Spinner />
          ) : (
            <Download className="size-4" strokeWidth={1.4} aria-hidden />
          )}
        </SystemButton>
        <SystemButton
          tooltip={
            canExportReport
              ? exportingReport
                ? 'Capture en cours…'
                : 'Enregistre la vue 3D et le rapport complet en PNG'
              : 'Calcule d’abord un thème natal pour exporter le rapport'
          }
          ariaLabel="Exporter la vue 3D et le rapport complet en PNG"
          onClick={onExportReport}
          disabled={!canExportReport || exportingReport}
        >
          {exportingReport ? (
            <Spinner />
          ) : (
            <FileText className="size-4" strokeWidth={1.35} aria-hidden />
          )}
        </SystemButton>
      </footer>

      <AnimatePresence>
        {exploreOpen && (
          <ExploreSpacePopover onClose={() => setExploreOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

interface SystemButtonProps {
  children: ReactNode;
  tooltip: string;
  ariaLabel: string;
  onClick: () => void;
  active?: boolean;
  activeTone?: IconButtonActiveTone;
  disabled?: boolean;
}

function SystemButton({
  children,
  tooltip,
  ariaLabel,
  onClick,
  active,
  activeTone = 'cyan',
  disabled = false,
}: SystemButtonProps) {
  return (
    <TooltipWrap text={tooltip} placement="top">
      <IconButton
        size="lg"
        active={active === true}
        activeTone={activeTone}
        onClick={onClick}
        aria-label={ariaLabel}
        {...(active !== undefined && { 'aria-pressed': active })}
        disabled={disabled}
        className="w-full duration-200"
      >
        {children}
      </IconButton>
    </TooltipWrap>
  );
}

function Spinner() {
  return (
    <Loader2
      className="size-3.5 animate-spin motion-reduce:animate-none"
      strokeWidth={1.6}
      aria-hidden
    />
  );
}
