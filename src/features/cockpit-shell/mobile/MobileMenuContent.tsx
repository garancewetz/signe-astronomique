import {
  CalendarDays,
  Check,
  Download,
  FileDown,
  Link2,
  List,
  Loader2,
} from 'lucide-react';
import { InfoCircleIcon } from '@/features/natal-report';
import { MenuRow } from '@/ui';
import { useT } from '@/context/useLocale';

interface MobileMenuContentProps {
  onOpenLegend: () => void;
  onOpenExploreSpace: () => void;
  onShareLink: () => void;
  shareCopied: boolean;
  canShareLink: boolean;
  onExportView: () => void;
  exportingView: boolean;
  onExportPdf: () => void;
  exportingPdf: boolean;
  canExportReport: boolean;
}

/**
 * The "Menu" tab: everything that is not the sky or the result — share,
 * exports, language, legend, links. Lives in the same bottom sheet as the
 * other tabs, with full-size rows, instead of a small pop-down under a "⋮".
 */
export function MobileMenuContent({
  onOpenLegend,
  onOpenExploreSpace,
  onShareLink,
  shareCopied,
  canShareLink,
  onExportView,
  exportingView,
  onExportPdf,
  exportingPdf,
  canExportReport,
}: MobileMenuContentProps) {
  const t = useT();
  const copy = t.mobile.menu;
  const spinner = <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />;

  return (
    <div className="px-3 pt-1 pb-4">
      <ul role="list" className="space-y-0.5">
        <li>
          <MenuRow
            size="lg"
            label={copy.share.label}
            sublabel={
              !canShareLink ? copy.share.sublabelLocked
                : shareCopied ? copy.share.sublabelCopied
                : undefined
            }
            icon={shareCopied
              ? <Check className="size-4" strokeWidth={1.6} aria-hidden />
              : <Link2 className="size-4" strokeWidth={1.4} aria-hidden />}
            disabled={!canShareLink}
            onClick={onShareLink}
          />
        </li>
        <li>
          <MenuRow
            size="lg"
            label={copy.exportReport.label}
            sublabel={canExportReport ? undefined : copy.exportReport.sublabelLocked}
            icon={exportingPdf ? spinner : <FileDown className="size-4" strokeWidth={1.4} aria-hidden />}
            disabled={!canExportReport || exportingPdf}
            onClick={onExportPdf}
          />
        </li>
        <li>
          <MenuRow
            size="lg"
            label={copy.exportView.label}
            icon={exportingView ? spinner : <Download className="size-4" strokeWidth={1.4} aria-hidden />}
            disabled={exportingView}
            onClick={onExportView}
          />
        </li>
        <Divider />
        <li>
          <MenuRow
            size="lg"
            label={copy.allSigns.label}
            icon={<CalendarDays className="size-4" strokeWidth={1.4} aria-hidden />}
            chevron
            onClick={() => window.location.assign('/signes/')}
          />
        </li>
        <li>
          <MenuRow
            size="lg"
            label={copy.legend.label}
            icon={<List className="size-4" strokeWidth={1.4} aria-hidden />}
            onClick={onOpenLegend}
          />
        </li>
        <li>
          <MenuRow
            size="lg"
            label={copy.explore.label}
            icon={<InfoCircleIcon />}
            onClick={onOpenExploreSpace}
          />
        </li>
      </ul>
    </div>
  );
}

function Divider() {
  return <li aria-hidden="true" className="my-2 mx-2 h-px bg-border-hud-faint" />;
}
