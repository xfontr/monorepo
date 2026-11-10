import { resolve } from "node:path";

const WORKSPACE_ROOT = resolve(import.meta.dirname, "../..");

export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@nuxt/ui", "@nuxt/content"],

    ssr: true,
    devtools: false,

    typescript: {
        typeCheck: false,
    },

    content: {
        experimental: {
            sqliteConnector: "native",
        },
    },

    nitro: {
        prerender: {
            ignore: [
                `${process.env.NUXT_APP_BASE_URL ?? "/"}huella-legal-storybook/`,
            ],
        },

        // The collectors reach outside `apps/developer-portal` on purpose, and the two vendored report
        // trees under `public/` are thousands of files the dev server has no reason to watch.
        watchOptions: {
            ignored: ["**/.report/**", "**/public/embed/**"],
        },
    },

    vite: {
        server: {
            fs: {
                allow: [WORKSPACE_ROOT],
            },
        },
    },

    runtimeConfig: {
        public: {
            repoUrl: "",
        },
    },

    app: {
        head: {
            title: "Monorepo",
        },
    },
});
