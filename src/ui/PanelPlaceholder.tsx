import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function PanelPlaceholder({ children }: Props) {
  return (
    <div className="text-slate-400 text-cockpit-md leading-relaxed mt-6 px-1 text-center">
      <div className="text-3xl mb-3 opacity-25" aria-hidden>◇</div>
      {children}
    </div>
  );
}
