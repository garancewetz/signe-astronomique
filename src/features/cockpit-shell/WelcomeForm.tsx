import { createPortal } from 'react-dom';
import type { CelestialReading } from '@/features/astronomy';
import { CoordinatesForm, type CityResult } from '@/features/natal-input';

interface WelcomeFormProps {
  /** From useWelcomeSlot. */
  target: HTMLElement | null;
  date: string;
  time: string;
  city: CityResult;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onCityChange: (v: CityResult) => void;
  onJump: (reading: CelestialReading) => void;
  onRecordHistory: (entry: { date: string; time: string; city: CityResult }) => void;
}

/**
 * The birth form, rendered inside the static welcome card on mobile so the
 * first screen holds the question *and* the field that answers it. Shares
 * the cockpit's form state; computing a sign closes the card (Cockpit). Renders
 * nothing once the card is gone (or on desktop, where the slot is null).
 * No autofocus: a phone would pop its date picker over the card.
 */
export function WelcomeForm({ target, onJump, onRecordHistory, ...form }: WelcomeFormProps) {
  if (!target) return null;
  return createPortal(
    <CoordinatesForm
      {...form}
      bare
      onRecordHistory={onRecordHistory}
      onJump={onJump}
      className="mt-5 space-y-3 text-left"
    />,
    target,
  );
}
