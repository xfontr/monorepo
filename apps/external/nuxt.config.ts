import { DEFAULT_LOCALE, LOCALES } from "./i18n/config";

export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@nuxtjs/i18n", "@nuxt/fonts", "@pinia/nuxt"],

    runtimeConfig: {
        tmsBaseURL: process.env.TMS_BASE_URL ?? "http://localhost:4000",
    },

    devtools: false,

    typescript: {
        typeCheck: "build",
    },

    i18n: {
        defaultLocale: DEFAULT_LOCALE,
        detectBrowserLanguage: false,
        locales: LOCALES,
    },

    fonts: {
        defaults: {
            weights: [300, 600, 900],
        },
    },

    pinia: {
        storesDirs: ["./app/stores/**", "./app/layers/**/app/stores/**"],
    },

    nitro: {
        compressPublicAssets: {
            brotli: true,
        }
    },
});
