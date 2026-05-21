// Public API for the natal-input feature: coordinate capture form,
// city autocomplete, mobile modal, and the supporting hooks.

export { CoordinatesForm } from './CoordinatesForm';
export {
  CityAutocomplete,
  type CityResult,
} from './CityAutocomplete';
export { MobileCoordinatesModal } from './MobileCoordinatesModal';

export {
  useNatalForm,
  type NatalFormState,
} from './useNatalForm';
export {
  useSearchHistory,
  signatureOf,
  type SearchHistoryEntry,
  type SearchHistoryState,
} from './useSearchHistory';
export {
  useGeolocation,
  type GeolocationResult,
} from './useGeolocation';

export {
  timezoneFromLatLon,
  localBirthToUtc,
} from './timezone';

export {
  buildShareUrl,
  clearNatalFromUrl,
  decodeNatalFromParams,
  encodeNatalToParams,
  formatNatalShareText,
  readNatalFromCurrentUrl,
  type SharedNatal,
} from './shareLink';

export { useShareLink } from './useShareLink';

export {
  computeReadingFromForm,
  type NatalFormInput,
} from './computeReadingFromForm';
