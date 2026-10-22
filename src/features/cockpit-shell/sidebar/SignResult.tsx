import { Check, Link2, Sparkles } from 'lucide-react';
import { cn, IconButton } from '@/ui';
import { TooltipWrap } from '../Tooltip';
import { useT } from '@/context/useLocale';

/* ── Result — the computed sign, a way back to the reveal, and sharing ─── */

/** One line of the chart summary ("☽ Lune — Poissons"). */
export interface KeyPlacement {
  glyph: string;
  label: string;
  /** Localized constellation, or null when it needs the birth time. */
  value: string | null;
}

export interface SignResultProps {
  collapsed: boolean;
  signLabel: string;
  placements: KeyPlacement[];
  active: boolean;
  unlocking: boolean;
  onOpen: () => void;
  onShare: () => void;
  shareCopied: boolean;
  canShare: boolean;
}

export function SignResult({
  collapsed,
  signLabel,
  placements,
  active,
  unlocking,
  onOpen,
  onShare,
  shareCopied,
  canShare,
}: SignResultProps) {
  const t = useT();
  const ShareIcon = shareCopied ? Check : Link2;
  const shareLabel = shareCopied ? t.sidebar.result.shareCopied : t.sidebar.result.share;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-2 border-b border-border-hud-faint">
        <TooltipWrap text={`${t.sidebar.result.eyebrow} · ${signLabel}`} placement="right">
          <IconButton
            size="xl"
            onClick={onOpen}
            active={active}
            aria-label={t.analysisCta.openAriaLabel}
            className={cn(
              unlocking && 'animate-rail-unlock',
              !active && !unlocking && 'border-amber-300/50 text-amber-100',
            )}
          >
            <Sparkles className="size-4.5" strokeWidth={1.4} aria-hidden />
          </IconButton>
        </TooltipWrap>
        <TooltipWrap text={shareLabel} placement="right">
          <IconButton
            size="lg"
            onClick={onShare}
            disabled={!canShare}
            active={shareCopied}
            aria-label={shareLabel}
          >
            <ShareIcon className="size-4" strokeWidth={1.5} aria-hidden />
          </IconButton>
        </TooltipWrap>
      </div>
    );
  }

  return (
    <div className="relative px-3 pt-3 pb-3 border-b border-border-hud-faint">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t.analysisCta.openAriaLabel}
        aria-pressed={active}
        className={cn(
          'cockpit-focus group w-full text-left rounded-md border px-3 py-2.5',
          'border-border-hud-subtle hover:border-border-hud-strong hover:bg-white/3',
          active && 'border-amber-200/50',
          'transition-colors',
          unlocking && 'animate-rail-unlock',
        )}
      >
        <div className="text-cockpit-sm text-slate-400">
          {t.sidebar.result.eyebrow}
        </div>
        <div className="font-serif text-2xl font-medium leading-tight text-amber-200 truncate">
          {signLabel}
        </div>
        <dl className="mt-2 pt-2 border-t border-border-hud-faint space-y-0.5 font-mono text-cockpit-md">
          {placements.map((p) => (
            <div key={p.label} className="flex items-baseline gap-2">
              <dt className="flex-1 min-w-0 truncate text-slate-400">
                <span aria-hidden="true" className="inline-block w-5 text-slate-500">{p.glyph}</span>
                {p.label}
              </dt>
              <dd className={p.value ? 'text-slate-100' : 'text-slate-500'}>
                {p.value ?? '—'}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-2 text-cockpit-md text-slate-300 underline decoration-slate-500
                        underline-offset-4 group-hover:decoration-slate-200">
          {t.sidebar.result.why}
        </div>
      </button>
      {/* Sits on the "full chart" line, inside the card's bottom-right
          corner — a sibling, since buttons can't nest. */}
      <button
        type="button"
        onClick={onShare}
        disabled={!canShare}
        className="cockpit-focus absolute right-6 bottom-5.5 inline-flex items-center gap-1.5 rounded
                   text-cockpit-md text-slate-300 hover:text-white
                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ShareIcon className="size-3.5" strokeWidth={1.6} aria-hidden />
        {shareCopied ? t.sidebar.result.shareCopied : t.signReveal.share}
      </button>
    </div>
  );
}
