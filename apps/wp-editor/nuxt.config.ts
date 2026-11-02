import { WORDPRESS_BASE_URL } from "./shared/site.ts";

export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@nuxt/ui"],

    // A local single-user tool; rendering in the browser keeps CodeMirror and the iframes simple.
    ssr: false,
    devtools: false,

    css: ["~/assets/css/main.css"],

    typescript: {
        typeCheck: false,
    },

    devServer: {
        host: "127.0.0.1",
        // Off huella-legal's 3000 and the translations service's 4000, so all three run at once.
        port: 3100,
    },

    colorMode: {
        preference: "system",
    },

    runtimeConfig: {
        wordpress: {
            baseURL: WORDPRESS_BASE_URL,
            username: "",
            applicationPassword: "",
        },
        editor: {
            store: "",
        },
    },

    app: {
        head: {
            title: "WP Editor",
        },
    },
});
