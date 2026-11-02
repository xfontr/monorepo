export default defineNuxtConfig({
    // Yoast kept WordPress's tag archives out of search, and the app's stay out too
    routeRules: {
        "/etiquetas/**": { robots: "noindex, follow" },
    },

    rendering: {
        "/publicaciones/": { isr: 60 * 60 * 24, varyOn: ["page", "sort", "format"] },
        "/areas/*": { isr: 60 * 60 * 24, varyOn: ["page", "sort", "format"] },
        "/etiquetas/*": { isr: 60 * 60 * 24, varyOn: ["page", "sort", "format"] },
        "/colaboradores/*": { isr: 60 * 60 * 24, varyOn: ["page", "sort", "format"] },
        "/areas/": { prerender: true },
        "/colaboradores/": { prerender: true },
        "/sobre/": { prerender: true },
    },
});
