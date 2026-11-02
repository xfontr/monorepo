export default defineNuxtConfig({
    routeRules: {
        "/buscar/**": { robots: "noindex, follow" },
    },

    rendering: {
        cache: {
            "/buscar/": { isr: 60 * 60 * 24, queryKeys: ["query", "page"] },
        },
    },
});
