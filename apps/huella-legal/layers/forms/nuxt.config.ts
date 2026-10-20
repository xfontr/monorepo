export default defineNuxtConfig({
    modules: ["@nuxtjs/turnstile"],

    // Declared empty so the module's always-pass dev keys never apply
    runtimeConfig: {
        turnstile: {
            secretKey: "",
        },

        public: {
            turnstile: {
                siteKey: "",
            },
        },
    },

    requiredEnv: {
        forms: ["NUXT_TURNSTILE_SECRET_KEY", "NUXT_PUBLIC_TURNSTILE_SITE_KEY"],
    },
});
