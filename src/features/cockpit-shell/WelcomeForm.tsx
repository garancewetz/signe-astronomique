import { createPortal } from 'react-dom';
import type { CelestialReading } from '@/features/astronomy';
import { CoordinatesForm, type CityResult } from '@/features/natal-input';
import { WELCOME_EVENTS } from './welcomeEvents';

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
  /** Desktop only: a phone would pop its date picker over the card. */
  autoFocusDate: boolean;
}

/**
 * The birth form, rendered inside the static welcome card so the first
 * thing a visitor sees is the question *and* the field that answers it —
 * no trip to the sidebar. Shares the cockpit's form state; computing a
 * sign closes the card. Renders nothing once the card is gone.
 */
export function WelcomeForm({ target, onJump, autoFocusDate, onRecordHistory, ...form }: WelcomeFormProps) {
  if (!target) return null;
  return createPortal(
    <CoordinatesForm
      {...form}
      bare
      autoFocusDate={autoFocusDate}
      onRecordHistory={onRecordHistory}
      onJump={(reading) => {
        onJump(reading);
        window.dispatchEvent(new Event(WELCOME_EVENTS.dismiss));
      }}
      className="mt-5 space-y-3 text-left"
    />,
    target,
  );
}
