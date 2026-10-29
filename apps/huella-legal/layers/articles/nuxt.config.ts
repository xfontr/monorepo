export default defineNuxtConfig({
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
