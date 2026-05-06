declare module 'tz-lookup' {
  /** Returns the IANA timezone name for the given coordinates. */
  function tzlookup(latitude: number, longitude: number): string;
  export default tzlookup;
}
