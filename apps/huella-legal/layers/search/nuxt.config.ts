export default defineNuxtConfig({
    routeRules: {
        "/buscar/**": { robots: "noindex, follow" },
    },
});
