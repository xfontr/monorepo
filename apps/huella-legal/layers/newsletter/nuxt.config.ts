export default defineNuxtConfig({
    components: [{ path: "components", ignore: ["NewsletterForm.vue"] }],

    runtimeConfig: {
        newsletter: {
            baseURL: "",
            apiKey: "",
            audienceId: "",
        },
    },

    requiredEnv: {
        newsletter: [
            "NUXT_NEWSLETTER_BASE_URL",
            "NUXT_NEWSLETTER_API_KEY",
            "NUXT_NEWSLETTER_AUDIENCE_ID",
        ],
    },
});
