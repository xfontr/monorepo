export default defineNuxtConfig({
    runtimeConfig: {
        comments: {
            username: "",
            applicationPassword: "",
        },
    },

    requiredEnv: {
        comments: ["NUXT_COMMENTS_USERNAME", "NUXT_COMMENTS_APPLICATION_PASSWORD"],
    },
});
