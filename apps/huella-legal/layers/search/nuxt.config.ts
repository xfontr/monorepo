export default defineNuxtConfig({
    routeRules: {
        "/buscar/**": { robots: "noindex, follow" },
    },

    rendering: {
        "/buscar/": { isr: 60 * 60 * 24, varyOn: ["query", "page"] },
    },
});
