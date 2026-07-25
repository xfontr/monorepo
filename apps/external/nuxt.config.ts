export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@nuxtjs/i18n", "@nuxt/fonts", "@pinia/nuxt"],

    runtimeConfig: {
        public: {
            tmsBaseUrl: process.env.TMS_BASE_URL ?? "http://localhost:4000",
        },
    },

    typescript: {
        typeCheck: "build",
    },

    i18n: {
        defaultLocale: "en-EN",
        detectBrowserLanguage: false,
        locales: [
            { code: "en-EN", name: "English (UK)", file: "index.ts" },
            { code: "es-ES", name: "Spanish (ES)", file: "index.ts" },
        ],
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
