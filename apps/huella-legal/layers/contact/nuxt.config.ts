export default defineNuxtConfig({
    runtimeConfig: {
        mail: {
            baseURL: "https://api.resend.com",
            apiKey: "",
            from: "info@huellalegal.com",
            to: "info@huellalegal.com",
        },
    },

    requiredEnv: {
        contact: ["NUXT_MAIL_API_KEY"],
    },
});
