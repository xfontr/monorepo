import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
    css: [fileURLToPath(new URL("./app/assets/prose.css", import.meta.url))],

    runtimeConfig: {
        articles: {
            cache: { maxAge: 60 * 60, swr: true },
        },

        public: {
            pageSlugs: ["aviso-legal"],
        },
    },

    $development: {
        runtimeConfig: {
            articles: {
                cache: { maxAge: 60 * 5, swr: false },
            },
        },
    },
});
