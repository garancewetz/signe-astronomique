/**
 * "Add my birth time" from the result (the ascendant needs it). The form
 * that hosts the time field may already be on screen (desktop sidebar) or
 * mount right after (mobile modal), so the request is both an event and a
 * pending flag the next form to mount picks up.
 */
export const ADD_BIRTH_TIME_EVENT = 'natal:add-birth-time';

let pending = false;

export function requestBirthTime(): void {
  pending = true;
  window.dispatchEvent(new Event(ADD_BIRTH_TIME_EVENT));
}

/** True once per request: the form that handles it clears it. */
export function takeBirthTimeRequest(): boolean {
  const was = pending;
  pending = false;
  return was;
}
