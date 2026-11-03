import { installModule } from "nuxt/kit";


export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    // `@nuxtjs/i18n` imports `vue-router/unplugin` too, and loading both at once trips a Node
    // ESM-loader assert, so it installs only once the preload has finished
    modules: [
        async () => {
            await import("vue-router/unplugin");
            await installModule("@nuxtjs/i18n");
        },
        "@monorepo/content/nuxt",
        "@nuxt/ui",
        "@nuxt/fonts",
        "@nuxt/image",
        "@nuxtjs/robots",
        "@nuxtjs/sitemap",
        "nuxt-schema-org",
        "nuxt-seo-utils",
    ],

    devtools: false,

    features: {
        inlineStyles: true,
    },

    app: {
        head: {
            link: [
                { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
                { rel: "manifest", href: "/site.webmanifest" },
            ],
            meta: [{ name: "theme-color", content: "#3e5a6d" }],
        },
    },

    experimental: {
        typedPages: true,
        routeTypedFetch: true,
        payloadExtraction: "client",
        defaults: {
            nuxtLink: { prefetchOn: { visibility: false, interaction: true } },
        },
    },

    $production: {
        hooks: {
            "build:manifest"(manifest) {
                for (const chunk of Object.values(manifest)) chunk.prefetch = false;
            },
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
        locales: [{ code: "es-ES", language: "es", file: "es-ES.json" }],
        defaultLocale: "es-ES",
        strategy: "no_prefix",
        detectBrowserLanguage: false,
    },

    // Unhead rewrites `useSeoMeta` calls at build time, which specs that mock it never see
    $test: {
        unhead: { vite: false },
    },

    $development: {
        content: {
            cache: {
                list: { maxAge: 60 * 5, swr: false },
                item: { maxAge: 60 * 5, swr: false },
            },
        },
    },

    rendering: {
        cache: {
            "/**": { isr: 60 * 60 * 24 },
            "/api/**": { isr: false },
            "/sitemap.xml": { isr: false },
            "/_i18n/**": { isr: 60 * 60 * 24 },
        },

        prerender: ["/robots.txt"],
    },

    site: {
        name: "Huella Legal",
        trailingSlash: true,
        env: "preview",
        separator: "-",
    },

    seo: {
        canonicalQueryWhitelist: ["page"],
    },

    robots: {
        header: false,
    },

    sitemap: {
        sources: [["/api/__sitemap__/urls", { timeout: 15_000 }]],
    },

    schemaOrg: {
        identity: {
            type: "Organization",
            name: "Huella Legal",
            logo: "/android-chrome-512x512.png",
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
