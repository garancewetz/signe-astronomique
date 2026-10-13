import { Check, Link2, Sparkles } from 'lucide-react';
import { Button, cn, IconButton } from '@/ui';
import { TooltipWrap } from '../Tooltip';
import { useT } from '@/context/useLocale';

/* ── Result — the computed sign, a way back to the reveal, and sharing ─── */

export interface SignResultProps {
  collapsed: boolean;
  signLabel: string;
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
              !active && !unlocking && 'animate-cta-glow border-amber-300/50 text-amber-100',
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
    <div className="px-3 pt-3 pb-3 space-y-2 border-b border-border-hud-faint">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t.analysisCta.openAriaLabel}
        aria-pressed={active}
        className={cn(
          'cockpit-focus group w-full text-left rounded-md border px-3 py-2.5',
          'border-amber-300/40 bg-amber-400/8 hover:bg-amber-400/14 hover:border-amber-300/60',
          'transition-colors',
          unlocking && 'animate-rail-unlock',
        )}
      >
        <div className="text-cockpit-xs tracking-cockpit-label uppercase text-amber-200/70">
          {t.sidebar.result.eyebrow}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-lg font-medium text-amber-100">
            ☉ {signLabel}
          </span>
          <span className="shrink-0 text-cockpit-sm text-amber-200/80 group-hover:text-amber-100">
            {t.sidebar.result.why}
          </span>
        </div>
      </button>
      <Button
        variant="outline"
        size="sm"
        onClick={onShare}
        disabled={!canShare}
        className="w-full tracking-cockpit-tight"
      >
        <ShareIcon className="size-3.5" strokeWidth={1.6} aria-hidden />
        {shareLabel}
      </Button>
    </div>
  );
}
