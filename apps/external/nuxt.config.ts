export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@budget-forecast/i18n/nuxt", "@nuxt/fonts", "@pinia/nuxt"],

    devtools: false,

    typescript: {
        typeCheck: "build",
    },

    translations: {
        project: "external",
        locales: [
            { code: "en-EN", name: "English (UK)" },
            { code: "es-ES", name: "Spanish (ES)" },
        ],
        vendor: {
            name: "test",
            baseURL: process.env.TMS_BASE_URL ?? "http://localhost:4000"
            id: process.env.TEST_ID ?? "kill-me",
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
