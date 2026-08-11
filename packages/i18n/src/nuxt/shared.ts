import type { LocaleObject } from "@nuxtjs/i18n";
import type { NitroRuntimeConfig } from "nitropack/types";
import type { Vendor } from "../core/domain/Vendor";
import type { TestConfigProvider } from "../core/adapters/TestProvider";

export type RuntimeConfig = NitroRuntimeConfig & { translations: TranslationsRuntimeConfig };

export interface TranslationsRuntimeConfig {
    locales: LocaleObject[]
    vendor: Vendor | Vendor<"", TestConfigProvider>
}

declare module "@nuxt/schema" {
    interface RuntimeConfig {
        translations: TranslationsRuntimeConfig
    }
}
