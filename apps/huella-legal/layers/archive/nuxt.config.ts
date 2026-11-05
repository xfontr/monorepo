export default defineNuxtConfig({
    // Yoast kept WordPress's tag archives out of search, and the app's stay out too
    routeRules: {
        "/etiquetas/**": { robots: "noindex, follow" },
    },

    rendering: {
        cache: {
            "/publicaciones/": { isr: 60 * 60 * 24 },
            "/areas/*": { isr: 60 * 60 * 24 },
            "/etiquetas/*": { isr: 60 * 60 * 24 },
            "/colaboradores/*": { isr: 60 * 60 * 24 },
        },
        prerender: ["/", "/areas/", "/colaboradores/", "/sobre/"],
    },
});
