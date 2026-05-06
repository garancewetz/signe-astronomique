import type { ReactNode } from 'react';
import { cn } from './cn';

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, children, className }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className="text-[9px] tracking-[0.3em] text-violet-400">{label}</span>
      {children}
    </label>
  );
}
