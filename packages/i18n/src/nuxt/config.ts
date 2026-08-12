import type { Locale } from "#core/domain/translations";
import type { VendorConfig } from "#core/registry";

export const TRANSLATIONS_API_PATH = "/api/translations";

export interface TranslationsConfig {
    vendor: VendorConfig
    locales: Locale[]
}

declare module "@nuxt/schema" {
    interface RuntimeConfig {
        translations: TranslationsConfig
    }
}
