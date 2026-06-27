import { en } from "@budget-forecast/i18n";

export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@nuxtjs/i18n", "@nuxt/fonts"],

    i18n: {
        defaultLocale: "en",
        detectBrowserLanguage: false,
        locales: [{ code: "en", name: "English", files: [en, "en.json"] }],
    },

    fonts: {
        defaults: {
            weights: [300, 600, 900],
        },
    },
});
