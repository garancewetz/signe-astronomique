import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type SurfaceProps = HTMLAttributes<HTMLDivElement>;

export function Surface({ className, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-sm border border-violet-400/30 bg-[#0d0820]/80 text-slate-100',
        className,
      )}
      {...props}
    />
  );
}
