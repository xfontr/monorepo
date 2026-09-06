import { resolve } from "node:path";

const WORKSPACE_ROOT = resolve(import.meta.dirname, "../..");

export default defineNuxtConfig({
    compatibilityDate: "2025-01-15",

    modules: ["@nuxt/ui", "@nuxt/content"],

    // Local-only tool: it reads the working tree and shells out to git. There is deliberately no
    // `build` script either, so `nx affected -t build` never tries to build something that has
    // nowhere to deploy.
    ssr: true,
    devtools: false,

    css: ["~/assets/css/main.css"],

    typescript: {
        typeCheck: false,
    },

    content: {
        experimental: {
            // `node:sqlite` instead of `better-sqlite3`, which is a native module with a postinstall
            // step — and lifecycle scripts are banned in this workspace, so the default connector
            // would work here and silently fail anywhere that installs with `--ignore-scripts`.
            sqliteConnector: "native",
        },
    },

    nitro: {
        // The collectors reach outside `apps/dashboard` on purpose, and the two vendored report
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

    app: {
        head: {
            title: "Repo dashboard",
            meta: [{ name: "robots", content: "noindex" }],
        },
    },
});
