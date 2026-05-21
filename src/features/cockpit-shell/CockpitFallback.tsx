import { Button, Surface } from '@/ui';
import { useT } from '@/context/useLocale';

interface CockpitFallbackProps {
  /** When provided, replaces the default reload action with a soft retry. */
  onReset?: () => void;
  /** Compact variant for sibling boundaries (e.g. around the 3D view). */
  variant?: 'fullscreen' | 'inline';
  /** Override the FR title. */
  title?: string;
  /** Override the FR body copy. */
  description?: string;
}

export function CockpitFallback({
  onReset,
  variant = 'fullscreen',
  title,
  description,
}: CockpitFallbackProps) {
  const t = useT();
  const isInline = variant === 'inline';
  const resolvedTitle =
    title ??
    (isInline ? t.errorBoundary.inlineTitle : t.errorBoundary.fullscreenTitle);
  const resolvedDescription =
    description ??
    (isInline
      ? t.errorBoundary.inlineDescription
      : t.errorBoundary.fullscreenDescription);

  const handleReload = () => window.location.reload();
  const primaryAction = onReset ?? handleReload;
  const primaryLabel = onReset
    ? t.errorBoundary.retry
    : t.errorBoundary.reload;

  const content = (
    <Surface
      tone="panel"
      role="alert"
      aria-live="assertive"
      className="max-w-md w-full px-6 py-7 rounded-panel text-center space-y-4"
    >
      <div className="text-cockpit-sm tracking-cockpit-label text-accent-label">
        {t.errorBoundary.label}
      </div>
      <h1 className="text-cockpit-xl tracking-cockpit-tight text-accent-title">
        {resolvedTitle}
      </h1>
      <p className="text-cockpit-md text-slate-300 leading-relaxed">
        {resolvedDescription}
      </p>
      <div className="flex justify-center pt-2">
        <Button
          variant="solid"
          size="md"
          onClick={primaryAction}
          aria-label={primaryLabel}
        >
          {primaryLabel}
        </Button>
      </div>
    </Surface>
  );

  if (isInline) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-6">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background">
      {content}
    </div>
  );
}
