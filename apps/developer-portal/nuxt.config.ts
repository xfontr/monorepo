import { resolve } from "node:path";

const WORKSPACE_ROOT = resolve(import.meta.dirname, "../..");

export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@nuxt/ui", "@nuxt/content"],

    ssr: true,
    devtools: false,

    css: ["~/assets/css/main.css"],

    typescript: {
        typeCheck: false,
    },

    content: {
        build: {
            markdown: {
                // Keyed by an absolute path because `@nuxt/content` `import()`s the key verbatim,
                // resolving neither a Nuxt alias nor a path relative to itself.
                remarkPlugins: {
                    [resolve(import.meta.dirname, "tools/lib/remarkDocLinks.ts")]: {},
                },
            },
        },

        experimental: {
            // `node:sqlite` instead of `better-sqlite3`, which is a native module with a postinstall
            // step — and lifecycle scripts are banned in this workspace, so the default connector
            // would work here and silently fail anywhere that installs with `--ignore-scripts`.
            sqliteConnector: "native",
        },
    },

    nitro: {
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

    ui: {
        theme: {
            colors: ["primary", "secondary", "success", "info", "warning", "error", "neutral"],
        },
    },

    // @nuxtjs/color-mode ships as a dependency of @nuxt/ui rather than a listed module, so its
    // defaults are otherwise invisible here. `fallback` only matters pre-hydration/no-JS; the
    // toggle and system preference both still override it.
    colorMode: {
        preference: "system",
        fallback: "dark",
    },

    runtimeConfig: {
        // Absolute, because the server that reads it is bundled somewhere else entirely. A static
        // build resolves it while prerendering, so `NUXT_SNAPSHOT_DIR` points CI at its own artifact.
        snapshotDir: resolve(import.meta.dirname, ".report"),

        public: {
            repoUrl: "",
        },
    },

    app: {
        head: {
            title: "Developer Portal",
            meta: [{ name: "robots", content: "noindex" }],
        },
    },
});
