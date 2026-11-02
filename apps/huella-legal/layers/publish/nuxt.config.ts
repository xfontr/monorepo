export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            submissionEmail: "colaboraciones@huellalegal.com",
        },
    },

    rendering: {
        "/publicar/": { prerender: true },
    },
});
