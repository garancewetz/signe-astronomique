import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { TooltipWrap } from '../Tooltip';
import { cn, IconButton } from '../ui';
import type { SectionKey } from './types';

interface SectionProps {
  sectionKey: SectionKey;
  title: string;
  icon: ReactNode;
  collapsed: boolean;
  expanded: boolean;
  onHeaderClick: () => void;
  /** Optional indicator (e.g. active-toggle counter chip) shown next to the title. */
  badge?: ReactNode;
  children: ReactNode;
}

export function SidebarSection({
  title,
  icon,
  collapsed,
  expanded,
  onHeaderClick,
  badge,
  children,
}: SectionProps) {
  const reduceMotion = useReducedMotion();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-1">
        <TooltipWrap text={title} placement="right">
          <IconButton
            size="xl"
            onClick={onHeaderClick}
            aria-label={`Étendre — ${title}`}
            className="relative"
          >
            <span aria-hidden="true">{icon}</span>
            {badge && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-cyan-300
                           shadow-[0_0_6px_2px_rgba(103,232,249,0.5)]"
              />
            )}
          </IconButton>
        </TooltipWrap>
      </div>
    );
  }

  return (
    <section className="px-2 py-1">
      <button
        type="button"
        onClick={onHeaderClick}
        aria-expanded={expanded}
        className={cn(
          'cockpit-focus group w-full',
          'flex items-center gap-2.5 h-9 px-2 rounded',
          'text-cockpit-sm tracking-cockpit-label uppercase',
          'transition-colors',
          expanded
            ? 'text-accent-title bg-violet-500/8'
            : 'text-accent-label/85 hover:text-accent-title hover:bg-violet-500/6',
        )}
      >
        <span aria-hidden="true" className="shrink-0 text-accent-label/85">
          {icon}
        </span>
        <span className="flex-1 text-left truncate">{title}</span>
        {badge}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 text-slate-500 transition-transform duration-200',
            expanded ? 'rotate-0' : '-rotate-90',
          )}
          strokeWidth={1.6}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <ul role="list" className="pt-1 pb-1.5 pl-2 pr-1 space-y-0.5">
              {children}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function SectionBadge({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} actif${count > 1 ? 's' : ''}`}
      className="shrink-0 inline-flex items-center justify-center box-border
                 min-w-[18px] h-[18px] px-1 rounded-full
                 text-cockpit-sm font-mono tabular-nums leading-[16px]
                 text-cyan-100 bg-cyan-400/15 border border-cyan-300/30"
    >
      {count}
    </span>
  );
}

export function SidebarDivider({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <li aria-hidden="true" className="my-1 mx-1 h-px bg-border-hud-faint" />
  );
}
