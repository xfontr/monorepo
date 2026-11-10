import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
    css: [fileURLToPath(new URL("./app/assets/prose.css", import.meta.url))],

    runtimeConfig: {
        articles: {
            cache: { maxAge: 60 * 60, swr: true },
            hiddenTerms: ["consultas-legales-gratuitas"],
        },

        public: {
            pageSlugs: ["aviso-legal", "calculo-intereses", "guia-de-publicaciones"],
        },
    },

    requiredEnv: {
        articles: ["NUXT_CONTENT_VENDOR_BASE_URL"],
    },

    rendering: {
        cache: {
            "/api/articles": {
                isr: 60 * 60 * 24,
                queryKeys: ["page", "sort", "format", "category", "tag", "author", "query"],
            },
            "/api/search": { isr: 60 * 60 * 24, queryKeys: ["query", "page"] },
            "/api/articles/**": { isr: 60 * 60 * 24 },
            "/api/articles/*/comments": { isr: 60 * 10 },
            "/api/pages/**": { isr: 60 * 60 * 24 },
            "/api/authors": { isr: 60 * 60 * 24 },
            "/api/subjects": { isr: 60 * 60 * 24 },
            "/api/home": { isr: 60 * 60 * 24 },
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
