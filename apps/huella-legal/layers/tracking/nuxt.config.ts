export default defineNuxtConfig({
    modules: ["@nuxt/scripts"],

    runtimeConfig: {
        public: {
            trackers: {
                googleAnalytics: { id: "" },
            },
        },
    },
});
