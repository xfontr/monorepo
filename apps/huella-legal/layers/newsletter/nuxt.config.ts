export default defineNuxtConfig({
    components: [{ path: "components", ignore: ["NewsletterForm.vue"] }],

    runtimeConfig: {
        newsletter: {
            baseURL: "https://api.kit.com",
            apiKey: "",
            formId: "",
        },
    },

    requiredEnv: {
        newsletter: ["NUXT_NEWSLETTER_API_KEY", "NUXT_NEWSLETTER_FORM_ID"],
    },
});
