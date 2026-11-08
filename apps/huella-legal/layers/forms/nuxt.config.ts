export default defineNuxtConfig({
    modules: ["@nuxtjs/turnstile"],

    runtimeConfig: {
        forms: {
            slowRepliesUntil: "",
        },

        mail: {
            baseURL: "https://api.resend.com",
            apiKey: "",
            from: "info@huellalegal.com",
        },

        // Declared empty so the module's always-pass dev keys never apply
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
        forms: ["NUXT_TURNSTILE_SECRET_KEY", "NUXT_PUBLIC_TURNSTILE_SITE_KEY", "NUXT_MAIL_API_KEY"],
    },
});
