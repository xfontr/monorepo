import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
    modules: ["@nuxt/scripts"],

    css: [
        "vanilla-cookieconsent/dist/cookieconsent.css",
        fileURLToPath(new URL("./app/assets/consent.css", import.meta.url)),
    ],

    runtimeConfig: {
        public: {
            trackers: {
                googleAnalytics: { id: "" },
            },
        },
    },
});
