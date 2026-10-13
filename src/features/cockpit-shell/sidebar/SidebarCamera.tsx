import { cn, IconButton } from '@/ui';
import { TooltipWrap } from '../Tooltip';
import { useT } from '@/context/useLocale';

/* ── Camera dock — quick fly-to (Sun / Moon / Earth) ──────────────────── */

interface CameraDockProps {
  onFlySun: () => void;
  onFlyMoon: () => void;
  onFlyEarth: () => void;
}

interface CameraDestination {
  key: 'sun' | 'moon' | 'earth';
  glyph: string;
  glyphClass: string;
  label: string;
  tooltip: string;
  ariaLabel: string;
}

function useCameraDestinations(): readonly CameraDestination[] {
  const t = useT();
  return [
    {
      key: 'sun',
      glyph: '☀',
      glyphClass: 'text-glyph-sun',
      label: t.sidebar.cameraDestinations.sun.label,
      tooltip: t.sidebar.cameraDestinations.sun.tooltip,
      ariaLabel: t.sidebar.cameraDestinations.sun.ariaLabel,
    },
    {
      key: 'moon',
      glyph: '☾',
      glyphClass: 'text-glyph-moon',
      label: t.sidebar.cameraDestinations.moon.label,
      tooltip: t.sidebar.cameraDestinations.moon.tooltip,
      ariaLabel: t.sidebar.cameraDestinations.moon.ariaLabel,
    },
    {
      key: 'earth',
      glyph: '⊕',
      glyphClass: 'text-glyph-earth',
      label: t.sidebar.cameraDestinations.earth.label,
      tooltip: t.sidebar.cameraDestinations.earth.tooltip,
      ariaLabel: t.sidebar.cameraDestinations.earth.ariaLabel,
    },
  ];
}

export function ExpandedCameraSection({ onFlySun, onFlyMoon, onFlyEarth }: CameraDockProps) {
  const t = useT();
  const destinations = useCameraDestinations();
  const handlers = { sun: onFlySun, moon: onFlyMoon, earth: onFlyEarth };
  return (
    <section
      aria-label={t.sidebar.cameraSectionAriaLabel}
      className="px-3 pt-2 pb-2 border-b border-border-hud-faint"
    >
      <div
        className="px-1 pb-2 text-cockpit-xs tracking-cockpit-label uppercase
                   text-slate-500"
      >
        {t.sidebar.cameraSectionLabel}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {destinations.map(({ key, glyph, glyphClass, tooltip, ariaLabel }) => (
          <TooltipWrap key={key} text={tooltip} placement="bottom">
            <IconButton
              size="lg"
              onClick={handlers[key]}
              aria-label={ariaLabel}
              className="w-full"
            >
              <span
                aria-hidden="true"
                className={cn('text-cockpit-glyph leading-none', glyphClass)}
              >
                {glyph}
              </span>
            </IconButton>
          </TooltipWrap>
        ))}
      </div>
    </section>
  );
}

export function CollapsedCameraRail({ onFlySun, onFlyMoon, onFlyEarth }: CameraDockProps) {
  const t = useT();
  const destinations = useCameraDestinations();
  const handlers = { sun: onFlySun, moon: onFlyMoon, earth: onFlyEarth };
  return (
    <ul
      role="list"
      aria-label={t.sidebar.cameraSectionAriaLabel}
      className="flex flex-col items-center gap-1 pt-2 pb-2 mb-1
                 border-b border-border-hud-faint"
    >
      {destinations.map(({ key, glyph, glyphClass, tooltip, ariaLabel }) => (
        <li key={key}>
          <TooltipWrap text={tooltip} placement="right">
            <IconButton
              size="lg"
              onClick={handlers[key]}
              aria-label={ariaLabel}
            >
              <span
                aria-hidden="true"
                className={cn('text-cockpit-glyph leading-none', glyphClass)}
              >
                {glyph}
              </span>
            </IconButton>
          </TooltipWrap>
        </li>
      ))}
    </ul>
  );
}
