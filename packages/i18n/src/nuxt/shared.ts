import type { LocaleObject } from "@nuxtjs/i18n";
import type { NitroRuntimeConfig } from "nitropack/types";
import type { VendorConfig } from "../core/registry";

export type RuntimeConfig = NitroRuntimeConfig & { translations: TranslationsRuntimeConfig };

export interface TranslationsRuntimeConfig {
    locales: LocaleObject[]
    vendor: VendorConfig
}

declare module "@nuxt/schema" {
    interface RuntimeConfig {
        translations: TranslationsRuntimeConfig
    }
}
