import faroUploader from "@grafana/faro-rollup-plugin";
import { execFileSync } from "node:child_process";
import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

type FaroSourceMapOptions = {
    appId: string
    appName: string
    apiKey: string
    endpoint: string
    gitHash: string
    stackId: string
    outputFiles: RegExp
    gzipContents: boolean
    keepSourcemaps: boolean
    verbose: boolean
}

const buildId = process.env.COMMIT_REF?.trim() || (() => {
    try {
        return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    }
    catch {
        if (process.env.CONTEXT === "production") {
            throw new Error("Netlify production builds require COMMIT_REF or Git metadata for telemetry versioning");
        }

        return "0.0.0";
    }
})();

const faroSourceMapVariables = [
    "GRAFANA_FARO_SOURCEMAP_API_KEY",
    "GRAFANA_FARO_SOURCEMAP_ENDPOINT",
    "GRAFANA_FARO_SOURCEMAP_APP_ID",
    "GRAFANA_FARO_SOURCEMAP_STACK_ID",
] as const;

const sourceMapValues = Object.fromEntries(
    faroSourceMapVariables.map((name) => [name, process.env[name]?.trim() ?? ""]),
) as Record<(typeof faroSourceMapVariables)[number], string>;
const missingSourceMapValues = faroSourceMapVariables.filter((name) => !sourceMapValues[name]);

if (Object.values(sourceMapValues).some(Boolean) && missingSourceMapValues.length) {
    throw new Error(`Faro source map upload requires: ${missingSourceMapValues.join(", ")}`);
}

const faroSourceMapOptions: FaroSourceMapOptions | undefined = missingSourceMapValues.length ? undefined : {
    appId: sourceMapValues.GRAFANA_FARO_SOURCEMAP_APP_ID,
    appName: "@monorepo/huella-legal",
    apiKey: sourceMapValues.GRAFANA_FARO_SOURCEMAP_API_KEY,
    endpoint: sourceMapValues.GRAFANA_FARO_SOURCEMAP_ENDPOINT,
    gitHash: buildId,
    stackId: sourceMapValues.GRAFANA_FARO_SOURCEMAP_STACK_ID,
    outputFiles: /\.js\.map$/,
    gzipContents: true,
    keepSourcemaps: false,
    verbose: true,
};

async function removeClientSourceMaps(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
            await removeClientSourceMaps(path);
        }
        else if (entry.isFile() && entry.name.endsWith(".js.map")) {
            await unlink(path);
        }
    }
}

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
                    buildId,
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
        storesDirs: ["./app/stores/**", "./app/layers/**/app/stores/**"],
    },

    nitro: {
        compressPublicAssets: {
            brotli: true,
        }
    },

    vite: {
        build: {
            sourcemap: false,
        },
    },

    hooks: {
        "vite:extendConfig": (config, { isServer }) => {
            if (isServer || !faroSourceMapOptions) return;

            const plugins = [
                ...(config.plugins ?? []),
                faroUploader(faroSourceMapOptions),
                {
                    name: "huella-remove-client-source-maps",
                    enforce: "post",
                    writeBundle: {
                        sequential: true,
                        async handler(options: { dir?: string }) {
                            if (options.dir) await removeClientSourceMaps(options.dir);
                        },
                    },
                },
            ];

            Object.assign(config, {
                build: { ...config.build, sourcemap: "hidden" },
                plugins,
            });
        },
    },
});
