import { useContext } from 'react';
import { CockpitDisplayCtx, type CockpitDisplayValue } from './cockpitDisplayContextInternal';

export type { CockpitDisplayValue };

export function useCockpitDisplay(): CockpitDisplayValue {
  const v = useContext(CockpitDisplayCtx);
  if (!v) {
    throw new Error(
      'useCockpitDisplay must be called inside <CockpitDisplayProvider>',
    );
  }
  return v;
}
