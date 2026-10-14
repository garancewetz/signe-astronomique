import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { TooltipWrap } from '../Tooltip';
import { IconButton } from '@/ui';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useT } from '@/context/useLocale';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function SidebarHeader({
  collapsed,
  onToggleCollapsed,
}: SidebarHeaderProps) {
  const t = useT();
  return (
    <header
      className="shrink-0 flex items-center justify-between gap-2
                 h-11 px-3
                 border-b border-border-hud-faint"
    >
      {!collapsed && (
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="truncate font-serif text-[15px] font-semibold
                       text-accent-title"
          >
            {t.cockpit.brand}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1 shrink-0">
        {!collapsed && <LanguageSwitcher />}
        <TooltipWrap
          text={collapsed ? t.sidebar.expandTooltip : t.sidebar.collapseTooltip}
          placement="right"
        >
          <IconButton
            onClick={onToggleCollapsed}
            aria-label={collapsed ? t.sidebar.expandAriaLabel : t.sidebar.collapseAriaLabel}
            aria-pressed={!collapsed}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" strokeWidth={1.4} aria-hidden />
            ) : (
              <ChevronsLeft className="size-4" strokeWidth={1.4} aria-hidden />
            )}
          </IconButton>
        </TooltipWrap>
      </div>
    </header>
  );
}
