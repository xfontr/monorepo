import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "vitest/config";
import type { CoverageOptions } from "vitest/node";
import createNodeConfig from "./node.ts";

export interface NuxtConfigOptions {
    /** The app root, usually `import.meta.dirname`. */
    root: string
    /** Specs under `app/` that need no Nuxt runtime, moved to the node project. */
    nodeSpecs?: string[]
    /** Setup files for the `nuxt` project, run after the Nuxt entry registers its boot but before it runs. */
    setupFiles?: string[]
    /** Extra paths kept out of the coverage denominator. */
    coverageExclude?: string[]
    thresholds?: CoverageOptions["thresholds"]
}

const NODE_DIRS = ["shared", "server", "tools"];

// Nuxt auto-registers `<rootDir>/layers/*`, and each layer repeats the app's own directory layout
const LAYER_SOURCES = ["layers/*/{app,server,shared}/**/*.ts", "layers/*/app/**/*.vue"];

/** A `node` project for `server/`, `shared/` and `tools/`, and a `nuxt` project for `app/`, in the root and every layer. */
async function createNuxtConfig({ root, nodeSpecs = [], setupFiles = [], coverageExclude = [], thresholds }: NuxtConfigOptions) {
    const nodeConfig = createNodeConfig();
    const { globalSetup, coverage, ...nodeTest } = nodeConfig.test ?? {};

    const nuxtProject = await defineNuxtProject(root, {
        name: "nuxt",
        fileParallelism: false,
        include: ["app/**/*.spec.ts", "layers/*/app/**/*.spec.ts"],
        exclude: nodeSpecs,
        setupFiles,
        environmentOptions: {
            nuxt: {
                rootDir: root,
                domEnvironment: "happy-dom",
                // Nx loads this config to build its graph, and a boot into `.nuxt` leaves it without
                // the tsconfigs `nuxt build`'s typecheck reads through the app's tsconfig.json
                overrides: { buildDir: join(root, "node_modules/.cache/nuxt-vitest") },
            },
        },
    });

    return defineConfig({
        test: {
            globalSetup,
            // Vitest reads coverage only from the root, so a block on either project is ignored
            coverage: {
                ...coverage,
                include: [...(coverage?.include ?? []), ...LAYER_SOURCES],
                exclude: [...(coverage?.exclude ?? []), ...coverageExclude],
                thresholds,
            },
            projects: [
                {
                    ...nodeConfig,
                    test: {
                        ...nodeTest,
                        name: "node",
                        include: NODE_DIRS.flatMap((dir) => [`${dir}/**/*.spec.ts`, `layers/*/${dir}/**/*.spec.ts`]).concat(nodeSpecs),
                    },
                },
                nuxtProject,
            ],
        },
    });
}

// Resolved from the app, so this runs the same copy its specs import `@nuxt/test-utils/runtime` from
async function defineNuxtProject(root: string, test: object) {
    const entry = createRequire(join(root, "package.json")).resolve("@nuxt/test-utils/config");
    const { defineVitestProject } = await import(pathToFileURL(entry).href) as typeof import("@nuxt/test-utils/config");

    // With jiti's module cache on, a TypeScript Nuxt module that installs @nuxtjs/i18n throws Node's
    // ERR_INTERNAL_ASSERTION as an unhandled rejection, which kills Vitest and Nx's plugin worker
    const jitiModuleCache = process.env.JITI_MODULE_CACHE;
    process.env.JITI_MODULE_CACHE = "0";

    try {
        return await defineVitestProject({ root, test });
    }
    finally {
        if (jitiModuleCache === undefined) delete process.env.JITI_MODULE_CACHE;
        else process.env.JITI_MODULE_CACHE = jitiModuleCache;
    }
}

export default createNuxtConfig;
