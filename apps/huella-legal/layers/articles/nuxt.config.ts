export default defineNuxtConfig({
    runtimeConfig: {
        articles: {
            cache: { maxAge: 60 * 60, swr: true },
        },

        public: {
            pageSlugs: ["aviso-legal", "calculo-intereses"],
        },
    },

    rendering: {
        cache: {
            "/api/articles": {
                isr: 60 * 60 * 24,
                queryKeys: ["page", "sort", "format", "category", "tag", "author"],
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
