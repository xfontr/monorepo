// Every key `useArticleListing` reads from the route, which the CDN must vary on
const LISTING = { isr: 60 * 60 * 24, queryKeys: ["page", "sort", "format", "query"] };

export default defineNuxtConfig({
    // Yoast kept WordPress's tag archives out of search, and the app's stay out too
    routeRules: {
        "/etiquetas/**": { robots: "noindex, follow" },
    },

    rendering: {
        cache: {
            "/publicaciones/": LISTING,
            "/areas/*": LISTING,
            "/etiquetas/*": LISTING,
            "/colaboradores/*": LISTING,
        },
        prerender: ["/", "/areas/", "/colaboradores/", "/sobre/"],
    },
});
