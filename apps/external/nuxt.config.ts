export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@budget-forecast/i18n/nuxt", "@nuxt/fonts", "@pinia/nuxt"],

    devtools: false,

    typescript: {
        typeCheck: "build",
    },

    translations: {
        vendor: {
            name: "tolgee",
            project: "external",
            baseURL: process.env.TRANSLATIONS_VENDOR_BASE_URL ?? "http://localhost:4000",
            options: {
                token: process.env.TRANSLATIONS_VENDOR_OPTIONS_TOKEN ?? "",
                projectId: process.env.TRANSLATIONS_VENDOR_OPTIONS_PROJECT_ID ?? "",
            }
        },
    },

    i18n: {
        locales: [
            { code: "en-GB", name: "English (UK)" },
            { code: "es-ES", name: "Spanish (ES)" },
        ],
        defaultLocale: "en-GB",
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
