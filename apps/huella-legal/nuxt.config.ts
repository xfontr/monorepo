export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@monorepo/i18n/nuxt", "@monorepo/content/nuxt", "@nuxt/ui", "@nuxt/fonts", "@pinia/nuxt"],

    devtools: false,

    css: ["~/assets/css/main.css"],

    // The design lab under `pages/lab/` is a dev-only review surface, so no build ever ships it
    $production: {
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

    // Provisional until early development ends, then Tolgee everywhere (README.md § i18n)
    $development: {
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
            observability: {
                url: "",
                app: {
                    name: "@monorepo/huella-legal",
                    version: "0.0.0",
                    environment: "development",
                },
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

    pinia: {
        storesDirs: ["./app/stores/**", "./layers/*/app/stores/**"],
    },

    nitro: {
        compressPublicAssets: {
            brotli: true,
        }
    },
});
