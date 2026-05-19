import type { ReactNode } from 'react';
import { cn } from './cn';

interface FieldProps {
  label: string;
  /** Must match the `id` of the labelable control rendered as a child. */
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

/**
 * Form field with an explicit `<label htmlFor>` binding. The caller owns the
 * input's `id` (typically via `useId()`) — this lets `Field` wrap composite
 * controls like `CityAutocomplete` without relying on implicit label nesting.
 */
export function Field({ label, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={htmlFor}
        className="text-[9px] tracking-cockpit-caps text-violet-400"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
