export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    // Loaded first because `typedPages` importing it while `@nuxtjs/i18n` loads trips a Node ESM-loader assert
    modules: [
        async () => {
            await import("vue-router/unplugin");
        },
        "@monorepo/i18n/nuxt",
        "@monorepo/content/nuxt",
        "@nuxt/ui",
        "@nuxt/fonts",
        "@nuxt/image",
    ],

    devtools: false,

    experimental: {
        typedPages: true,
        // Nuxt 4.6's default `$fetch` typing fails with TS2321 on `/api/newsletter`.
        routeTypedFetch: true,
        // `true` makes every isr page fetch its payload as a second request, `_payload.json`
        payloadExtraction: "client",
    },

    // The design lab under `pages/lab/` is a dev-only review surface, so no build ever ships it
    $production: {
        hooks: {
            "pages:extend"(pages) {
                for (let index = pages.length - 1; index >= 0; index--) {
                    if (pages[index]?.path.startsWith("/lab")) pages.splice(index, 1);
                }
            },
        },

        requiredEnv: {
            translations: ["NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN"],
        },
    },

    typescript: {
        typeCheck: "build",
        tsConfig: {
            include: ["../vitest.setup.ts"],
            vueCompilerOptions: { checkUnknownComponents: true },
        },
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
            project: "34150",
            baseURL: "https://app.tolgee.io/",
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

        requiredEnv: {
            translations: ["NUXT_TRANSLATIONS_VENDOR_BASE_URL"],
        },

        content: {
            cache: {
                list: { maxAge: 60 * 5, swr: false },
                item: { maxAge: 60 * 5, swr: false },
            },
        },
    },

    content: {
        vendor: {
            name: "wordpress",
            baseURL: "https://huellalegal.com",
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
                url: "https://www.huellalegal.com",
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

    image: {
        domains: ["www.huellalegal.com"],
    },

    nitro: {
        compressPublicAssets: {
            brotli: true,
        },

        experimental: {
            openAPI: true,
        },

        openAPI: {
            production: "runtime",
            meta: {
                title: "Huella Legal API",
                description: "The BFF routes the Huella Legal site reads and posts its forms to.",
            },
            ui: {
                swagger: false,
            },
        },
    },
});
