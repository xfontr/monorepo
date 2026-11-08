export default defineNuxtConfig({
    components: [{ path: "components", ignore: ["NewsletterForm.vue"] }],

    routeRules: {
        "/suscripcion-confirmada/": { robots: "noindex, follow" },
    },

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
