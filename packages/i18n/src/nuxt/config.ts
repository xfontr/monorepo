import type { Locale } from "#core/domain/translations";
import type { VendorConfig } from "#core/registry";

export const TRANSLATIONS_API_PATH = "/api/translations";

export const TRANSLATIONS_MAX_AGE = 60 * 60;
export const TRANSLATIONS_STALE_MAX_AGE = 60 * 60 * 24;

export interface TranslationsConfig {
    vendor: VendorConfig
    locales: Locale[]
}

declare module "@nuxt/schema" {
    interface RuntimeConfig {
        translations: TranslationsConfig
    }
}
