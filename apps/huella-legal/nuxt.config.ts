// The same windows `@monorepo/content` and `@monorepo/i18n` give their own caches
const LIST_CACHE = { cache: { swr: true, maxAge: 60 * 60, staleMaxAge: 60 * 60 * 24 } };
const ITEM_CACHE = { cache: { swr: true, maxAge: 60 * 60 * 6, staleMaxAge: 60 * 60 * 24 * 7 } };

export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    // Loaded first because `typedPages` importing it while `@nuxtjs/i18n` loads trips a Node ESM-loader assert
    modules: [
        async () => { await import("vue-router/unplugin"); },
        // Vue counts an onServerPrefetch hook (every Nuxt Icon has one) as a useId boundary, so a client
        // build that strips it hydrates Reka's aria-controls with ids the server never rendered
        (_, nuxt) => {
            const shaken = nuxt.options.optimization.treeShake.composables.client;

            if (shaken.vue) shaken.vue = shaken.vue.filter((name) => name !== "onServerPrefetch");
        },
        "@monorepo/i18n/nuxt",
        "@monorepo/content/nuxt",
        "@nuxt/ui",
        "@nuxt/fonts",
    ],

    devtools: false,

    experimental: {
        typedPages: true,
        // A cache rule otherwise makes each visible link prefetch a `_payload.json`: a cold render
        payloadExtraction: false,
    },

    css: ["~/assets/css/main.css"],

    $production: {
        // Dev mounts the cache on disk, so a cached page would outlive the edit that changed it
        routeRules: {
            "/**": ITEM_CACHE,
            "/": LIST_CACHE,
            // Nitro routes `/publicaciones/` to the `/**` handler, not `/publicaciones/**`, so each
            // listing index needs its own rule
            "/publicaciones": LIST_CACHE,
            "/publicaciones/**": LIST_CACHE,
            "/materias": LIST_CACHE,
            "/materias/**": LIST_CACHE,
            "/etiquetas/**": LIST_CACHE,
            "/colaboradores": LIST_CACHE,
            "/colaboradores/**": LIST_CACHE,
            "/buscar": LIST_CACHE,
            "/buscar/**": LIST_CACHE,
            "/feed": LIST_CACHE,
            "/feed/**": LIST_CACHE,
            "/sitemap.xml": LIST_CACHE,
            "/robots.txt": { cache: false },
            "/api/**": { cache: false },
            "/api/articles/**": LIST_CACHE,
            "/_i18n/**": LIST_CACHE,
        },

        // The design lab under `pages/lab/` is a dev-only review surface, so no build ever ships it
        hooks: {
            "pages:extend"(pages) {
                for (let index = pages.length - 1; index >= 0; index--) {
                    if (pages[index]?.path.startsWith("/lab")) pages.splice(index, 1);
                }
            },
        },
    },

    typescript: {
        typeCheck: "build",
        tsConfig: { include: ["../vitest.setup.ts"] },
    },

    i18n: {
        locales: [{ code: "es-ES", language: "es" }],
        defaultLocale: "es-ES",
        strategy: "no_prefix",
        detectBrowserLanguage: false,
    },

    translations: {
        vendor: {
            name: "tolgee",
            project: "",
            baseURL: "",
            options: {
                token: "",
            },
        },
    },

    $development: {
        // Lab pages draw their own lab header and footer, so the site shell would render twice
        hooks: {
            "pages:extend"(pages) {
                for (const page of pages) {
                    if (page.path.startsWith("/lab")) page.meta = { ...page.meta, layout: false };
                }
            },
        },

        // Provisional until early development ends, then Tolgee everywhere (README.md § i18n)
        translations: {
            vendor: {
                name: "internal",
                project: "huella-legal",
                baseURL: "",
            },
        },
    },

    content: {
        vendor: {
            name: "wordpress",
            baseURL: "",
        },
    },

    runtimeConfig: {
        observability: {
            url: "",
            instanceId: "",
            token: "",
        },

        public: {
            site: {
                url: "",
            },

            observability: {
                url: "",
                app: {
                    name: "@monorepo/huella-legal",
                    version: "0.0.0",
                    environment: "development",
                },
            },

            social: {
                instagram: "",
                linkedin: "",
                x: "",
            },
        },
    },

    ui: {
        colorMode: false,
        theme: {
            colors: ["primary", "secondary", "neutral", "error"],
        },
    },

    fonts: {
        defaults: {
            weights: [400, 500, 600, 700],
        },
    },

    nitro: {
        compressPublicAssets: {
            brotli: true,
        },
        // Keyed by the full URL, query string included, so an unbounded store never stops growing
        storage: {
            cache: { driver: "lru-cache", maxSize: 128 * 1024 * 1024 },
        },
    },
});
