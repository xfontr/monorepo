export const TRANSLATIONS_PROJECT = "external";

export const TRANSLATIONS_API_PATH = "/api/translations";

export const LOCALES = [
    { code: "en-EN", name: "English (UK)", file: "index.ts" },
    { code: "es-ES", name: "Spanish (ES)", file: "index.ts" },
];

export const DEFAULT_LOCALE = LOCALES[0]!.code;

/** Seconds a locale is served from cache before Nitro revalidates it against the TMS. */
export const TRANSLATIONS_MAX_AGE = 60 * 60;

/** Seconds a stale locale may still be served while it revalidates in the background. */
export const TRANSLATIONS_STALE_MAX_AGE = 60 * 60 * 24;
