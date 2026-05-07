import { BookOpen, Database, Map, Sparkles, Telescope } from 'lucide-react';
import { RailButton } from './RailButton';
import type { ReportPanelKey } from './RightPanel';

export type RightRailKey = ReportPanelKey | 'body';

interface RightRailProps {
  activeKey: RightRailKey | null;
  onToggle: (key: RightRailKey) => void;
  /** Adds the Telescope slot (body details) at the bottom of the rail. */
  hasSelectedBody: boolean;
}

/**
 * Right navigation rail: information & analysis. The four report icons
 * are always visible; the Telescope slot only appears when a body is
 * selected and renders BodyInfoHud as its docked content.
 */
export function RightRail({ activeKey, onToggle, hasSelectedBody }: RightRailProps) {
  return (
    <nav
      aria-label="Information et analyse"
      className="absolute top-11 bottom-[calc(6rem+env(safe-area-inset-bottom,0))] right-0 z-30
                 w-[50px] flex flex-col items-center gap-1.5 py-3
                 bg-surface-console/40 backdrop-blur-md
                 border-l border-border-hud-faint"
    >
      <RailButton
        side="right"
        active={activeKey === 'resume'}
        onClick={() => onToggle('resume')}
        icon={<Sparkles className="size-5" strokeWidth={1.4} aria-hidden />}
        label="Résumé"
        ariaControls="panel-resume"
        ariaExpanded={activeKey === 'resume'}
      />
      <RailButton
        side="right"
        active={activeKey === 'carte'}
        onClick={() => onToggle('carte')}
        icon={<Map className="size-5" strokeWidth={1.4} aria-hidden />}
        label="Carte"
        ariaControls="panel-carte"
        ariaExpanded={activeKey === 'carte'}
      />
      <RailButton
        side="right"
        active={activeKey === 'lecture'}
        onClick={() => onToggle('lecture')}
        icon={<BookOpen className="size-5" strokeWidth={1.4} aria-hidden />}
        label="Lecture"
        ariaControls="panel-lecture"
        ariaExpanded={activeKey === 'lecture'}
      />
      <RailButton
        side="right"
        active={activeKey === 'donnees'}
        onClick={() => onToggle('donnees')}
        icon={<Database className="size-5" strokeWidth={1.4} aria-hidden />}
        label="Données"
        ariaControls="panel-donnees"
        ariaExpanded={activeKey === 'donnees'}
      />
      {hasSelectedBody && (
        <>
          <span aria-hidden="true" className="my-1 h-px w-6 bg-border-hud-faint" />
          <RailButton
            side="right"
            active={activeKey === 'body'}
            onClick={() => onToggle('body')}
            icon={<Telescope className="size-5" strokeWidth={1.4} aria-hidden />}
            label="Détails de l’objet sélectionné"
            ariaControls="panel-body"
            ariaExpanded={activeKey === 'body'}
          />
        </>
      )}
    </nav>
  );
}
