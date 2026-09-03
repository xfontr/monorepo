export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@monorepo/i18n/nuxt", "@monorepo/content/nuxt", "@nuxt/fonts", "@pinia/nuxt"],

    devtools: false,

    typescript: {
        typeCheck: "build",
    },

    i18n: { locales: ["en-GB", "es-ES"], defaultLocale: "en-GB" },

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

    fonts: {
        defaults: {
            weights: [300, 600, 900],
        },
    },

    pinia: {
        storesDirs: ["./app/stores/**", "./app/layers/**/app/stores/**"],
    },

    nitro: {
        compressPublicAssets: {
            brotli: true,
        }
    },
});
