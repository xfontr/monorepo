export default defineNuxtConfig({
    runtimeConfig: {
        mail: {
            to: "info@huellalegal.com",
        },
    },

    rendering: {
        prerender: ["/contacto/"],
    },
});
