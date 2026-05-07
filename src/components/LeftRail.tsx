import { Clock, Compass } from 'lucide-react';
import { RailButton } from './RailButton';

interface LeftRailProps {
  coordonneesOpen: boolean;
  onToggleCoordonnees: () => void;
  onJumpNow: () => void;
}

/**
 * Left navigation rail: time/space controls. Compass opens the natal
 * coordinates form; Clock fires AUJOURD'HUI (one-shot, no toggle).
 */
export function LeftRail({
  coordonneesOpen,
  onToggleCoordonnees,
  onJumpNow,
}: LeftRailProps) {
  return (
    <nav
      aria-label="Navigation temporelle"
      className="absolute top-11 bottom-[calc(6rem+env(safe-area-inset-bottom,0))] left-0 z-30
                 w-[50px] flex flex-col items-center gap-1.5 py-3
                 bg-surface-console/40 backdrop-blur-md
                 border-r border-border-hud-faint"
    >
      <RailButton
        side="left"
        active={coordonneesOpen}
        onClick={onToggleCoordonnees}
        icon={<Compass className="size-5" strokeWidth={1.4} aria-hidden />}
        label="Coordonnées de naissance"
        ariaControls="panel-coordonnees"
        ariaExpanded={coordonneesOpen}
      />
      <RailButton
        side="left"
        onClick={onJumpNow}
        icon={<Clock className="size-5" strokeWidth={1.4} aria-hidden />}
        label="Aujourd’hui — calcule le ciel maintenant"
      />
    </nav>
  );
}
