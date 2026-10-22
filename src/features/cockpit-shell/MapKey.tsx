import type { ReactNode } from 'react';
import { cn } from '@/ui';
import { useT } from '@/context/useLocale';

interface MapKeyProps {
  /** Where it sits in the canvas. */
  placement: 'bottom-left' | 'top-left';
}

/**
 * A map key, always on screen with the natal sky: what the gold, grey and
 * blue marks mean. Without it, the sky reads as decoration; with it, as a
 * chart. Purely informational, so it never takes clicks meant for the sky.
 */
export function MapKey({ placement }: MapKeyProps) {
  const t = useT();
  const k = t.sky.key;
  return (
    <ul
      aria-label={k.ariaLabel}
      className={cn(
        'pointer-events-none absolute z-20 left-3 space-y-1 px-2.5 py-2 rounded-md',
        'border border-border-hud-subtle bg-surface-console/70 backdrop-blur-sm',
        'text-cockpit-sm leading-tight text-slate-300',
        placement === 'bottom-left' ? 'bottom-3' : 'top-3',
      )}
    >
      <Row label={k.zone}>
        <span className="block w-4 h-[3px] rounded-full bg-amber-200" />
      </Row>
      <Row label={k.boundary}>
        <span className="block w-px h-3 mx-auto bg-slate-400" />
      </Row>
      <Row label={k.figure}>
        <span className="block w-4 h-px bg-cyan-300" />
      </Row>
      <Row label={k.earth}>
        <span className="block size-3 mx-auto rounded-full border border-[#9fb4e8]" />
      </Row>
    </ul>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className="w-4 shrink-0">{children}</span>
      <span>{label}</span>
    </li>
  );
}
