export const JOURNAL_LOCALE = "es-ES";

// Pinned to the journal's zone so the server and the browser print the same day
export const LONG_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" };
