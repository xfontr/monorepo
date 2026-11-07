export default defineNuxtConfig({
    modules: ["@nuxt/scripts"],

    vite: { optimizeDeps: { include: ["vanilla-cookieconsent"] } },

    runtimeConfig: {
        public: {
            trackers: {
                googleAnalytics: { id: "" },
            },
        },
    },
});
