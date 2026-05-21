import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Champs cockpit — applique les styles `.cockpit-input` du thème global. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn('cockpit-input w-full', className)} {...props} />;
});
