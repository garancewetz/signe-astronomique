import type { HTMLAttributes } from 'react';
import { cn } from './cn';
import { surfaceClasses, type SurfaceTone } from './surfaceClasses';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
}

/**
 * Plain `<div>` with cockpit-chrome baked in. For animated or custom-tag
 * surfaces (`motion.aside`, `<dialog>`, `<header>`), call `surfaceClasses`
 * directly instead.
 */
export function Surface({ tone = 'panel', className, ...props }: SurfaceProps) {
  return <div className={cn(surfaceClasses(tone), className)} {...props} />;
}
