import { useState, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Download,
  FileDown,
  List,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { TooltipWrap } from '../Tooltip';
import { ExploreSpacePopover, InfoCircleIcon } from '@/features/natal-report';
import { cn, IconButton, type IconButtonActiveTone } from '@/ui';
import { useT } from '@/context/useLocale';

interface SystemDockProps {
  collapsed: boolean;
  legendActive: boolean;
  onToggleLegend: () => void;
  fullscreenActive: boolean;
  onToggleFullscreen: () => void;
  onExportView: () => void;
  exportingView: boolean;
  onExportPdf: () => void;
  exportingPdf: boolean;
  canExportReport: boolean;
}

export function SystemDock({
  collapsed,
  legendActive,
  onToggleLegend,
  fullscreenActive,
  onToggleFullscreen,
  onExportView,
  exportingView,
  onExportPdf,
  exportingPdf,
  canExportReport,
}: SystemDockProps) {
  const t = useT();
  const [exploreOpen, setExploreOpen] = useState(false);

  return (
    <>
      <footer
        role="group"
        aria-label={t.systemDock.sectionAriaLabel}
        className={cn(
          'shrink-0 border-t border-border-hud-faint',
          'pb-[env(safe-area-inset-bottom,0)]',
          collapsed
            ? 'flex flex-col items-center gap-1 py-2'
            : 'grid grid-cols-3 gap-1 px-2 py-2',
        )}
      >
        <SystemButton
          tooltip={t.systemDock.explore.tooltip}
          ariaLabel={t.systemDock.explore.ariaLabel}
          active={exploreOpen}
          activeTone="sky"
          onClick={() => setExploreOpen((v) => !v)}
        >
          <InfoCircleIcon />
        </SystemButton>
        <SystemButton
          tooltip={t.systemDock.legend.tooltip}
          ariaLabel={t.systemDock.legend.ariaLabel}
          active={legendActive}
          activeTone="sky"
          onClick={onToggleLegend}
        >
          <List className="size-4" strokeWidth={1.4} aria-hidden />
        </SystemButton>
        <SystemButton
          tooltip={fullscreenActive ? t.systemDock.fullscreen.tooltipExit : t.systemDock.fullscreen.tooltipEnter}
          ariaLabel={fullscreenActive ? t.systemDock.fullscreen.tooltipExit : t.systemDock.fullscreen.tooltipEnter}
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
          tooltip={t.systemDock.exportView.tooltip}
          ariaLabel={t.systemDock.exportView.ariaLabel}
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
              ? exportingPdf
                ? t.systemDock.exportPdf.tooltipGenerating
                : t.systemDock.exportPdf.tooltipReady
              : t.systemDock.exportPdf.tooltipLocked
          }
          ariaLabel={t.systemDock.exportPdf.ariaLabel}
          onClick={onExportPdf}
          disabled={!canExportReport || exportingPdf}
        >
          {exportingPdf ? (
            <Spinner />
          ) : (
            <FileDown className="size-4" strokeWidth={1.35} aria-hidden />
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
