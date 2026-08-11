import type { LocaleObject } from "@nuxtjs/i18n";
import type { NitroRuntimeConfig } from "nitropack/types";

export const TRANSLATIONS_API_PATH = "/api/translations";

export const HTTP_BAD_REQUEST = 400;
export const HTTP_BAD_GATEWAY = 502;
export const HTTP_INTERNAL_SERVER_ERROR = 500;

export type RuntimeConfig = NitroRuntimeConfig & { translations: TranslationsRuntimeConfig };

export interface TranslationsRuntimeConfig {
    tmsBaseURL: string
    project: string
    locales: LocaleObject[]
    vendor: "server"
}

declare module "@nuxt/schema" {
    interface RuntimeConfig {
        translations: TranslationsRuntimeConfig
    }
}
