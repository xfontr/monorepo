export default defineNuxtConfig({
    // Yoast kept WordPress's tag archives out of search, and the app's stay out too
    routeRules: {
        "/etiquetas/**": { robots: "noindex, follow" },
    },
});
