// `@nuxtjs/i18n` imports this too, and loading both at once trips a Node ESM-loader assert
await import("vue-router/unplugin");

const SITE_URL = "https://www.huellalegal.com";
const WORDPRESS_HOST = URL.parse(process.env.NUXT_CONTENT_VENDOR_BASE_URL ?? "")?.host;

export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: [
        "@nuxtjs/i18n",
        "@monorepo/content/nuxt",
        "@nuxt/ui",
        "@nuxt/fonts",
        "@nuxt/image",
        "@nuxtjs/robots",
        "@nuxtjs/sitemap",
        "nuxt-llms",
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
        viewTransition: true,
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
                for (const chunk of Object.values(manifest)) {
                    chunk.prefetch = false;
                    if (chunk.resourceType === "script") chunk.preload = false;
                }
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
        experimental: { httpCacheDuration: 60 * 60 * 24 * 365 },
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

    routeRules: {
        "/**": {
            headers: {
                "Strict-Transport-Security": "max-age=31536000",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
                "Content-Security-Policy":
                    "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
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
        // Crawlers that train models rather than send readers; search engines and `llms.txt` stay open
        groups: [
            {
                userAgent: [
                    "GPTBot",
                    "CCBot",
                    "Google-Extended",
                    "ClaudeBot",
                    "Bytespider",
                    "meta-externalagent",
                    "Applebot-Extended",
                ],
                disallow: ["/"],
            },
        ],
    },

    sitemap: {
        sources: [["/api/__sitemap__/urls", { timeout: 15_000 }]],
    },

    llms: {
        domain: SITE_URL,
        title: "Huella Legal",
        description: "Revista jurídica abierta y gratuita, escrita por su comunidad desde 2020.",
        sections: [
            {
                title: "Secciones",
                links: [
                    {
                        title: "Publicaciones",
                        description: "Todos los artículos",
                        href: `${SITE_URL}/publicaciones/`,
                    },
                    {
                        title: "Áreas",
                        description: "Artículos por área del derecho",
                        href: `${SITE_URL}/areas/`,
                    },
                    {
                        title: "Colaboradores",
                        description: "Quién escribe en la revista",
                        href: `${SITE_URL}/colaboradores/`,
                    },
                    {
                        title: "Buscar",
                        description: "Buscador de artículos",
                        href: `${SITE_URL}/buscar/`,
                    },
                ],
            },
            {
                title: "Más",
                links: [
                    {
                        title: "Sobre Huella Legal",
                        description: "Qué es la revista y quién la hace",
                        href: `${SITE_URL}/sobre/`,
                    },
                    {
                        title: "Cálculo de intereses",
                        description: "Calculadora de intereses",
                        href: `${SITE_URL}/calculo-intereses/`,
                    },
                    {
                        title: "Publicar",
                        description: "Cómo proponer un artículo",
                        href: `${SITE_URL}/publicar/`,
                    },
                    {
                        title: "Contacto",
                        description: "Escribir a la revista",
                        href: `${SITE_URL}/contacto/`,
                    },
                ],
            },
        ],
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
                url: SITE_URL,
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
        domains: ["www.huellalegal.com", ...(WORDPRESS_HOST ? [WORDPRESS_HOST] : [])],
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
