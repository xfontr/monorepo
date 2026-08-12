export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@budget-forecast/i18n/nuxt", "@nuxt/fonts", "@pinia/nuxt"],

    devtools: false,

    typescript: {
        typeCheck: "build",
    },

    i18n: { locales: ["en-GB", "es-ES"], defaultLocale: "en-GB" },

    translations: {
        vendor: {
            name: "tolgee",
            project: process.env.TRANSLATIONS_VENDOR_PROJECT ?? "",
            baseURL: process.env.TRANSLATIONS_VENDOR_BASE_URL ?? "",
            options: {
                token: process.env.TRANSLATIONS_VENDOR_OPTIONS_TOKEN ?? "",
            }
        },
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
