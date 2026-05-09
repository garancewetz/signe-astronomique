import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { TooltipWrap } from '../Tooltip';
import { IconButton } from '../ui';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function SidebarHeader({
  collapsed,
  onToggleCollapsed,
}: SidebarHeaderProps) {
  return (
    <header
      className="shrink-0 flex items-center justify-between
                 h-11 px-3
                 border-b border-border-hud-faint"
    >
      {!collapsed && (
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 rounded-full bg-cyan-300
                       shadow-[0_0_8px_2px_rgba(103,232,249,0.55)]"
          />
          <span
            className="truncate text-cockpit-sm tracking-cockpit-hud
                       text-accent-title uppercase"
          >
            CIEL&nbsp;RÉEL
          </span>
        </div>
      )}
      <TooltipWrap
        text={collapsed ? 'Étendre la console' : 'Réduire la console'}
        placement="right"
      >
        <IconButton
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Étendre la console' : 'Réduire la console'}
          aria-pressed={!collapsed}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" strokeWidth={1.4} aria-hidden />
          ) : (
            <ChevronsLeft className="size-4" strokeWidth={1.4} aria-hidden />
          )}
        </IconButton>
      </TooltipWrap>
    </header>
  );
}
