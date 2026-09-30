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
    /** Extra paths kept out of the coverage denominator. */
    coverageExclude?: string[]
    thresholds?: CoverageOptions["thresholds"]
}

/** A `node` project for `server/`, `shared/` and `tools/`, and a `nuxt` project for `app/`. */
async function createNuxtConfig({ root, nodeSpecs = [], coverageExclude = [], thresholds }: NuxtConfigOptions) {
    const nodeConfig = createNodeConfig();
    const { globalSetup, coverage, ...nodeTest } = nodeConfig.test ?? {};

    const nuxtProject = await defineNuxtProject(root, {
        name: "nuxt",
        fileParallelism: false,
        include: ["app/**/*.spec.ts"],
        exclude: nodeSpecs,
        environmentOptions: { nuxt: { rootDir: root, domEnvironment: "happy-dom" } },
    });

    return defineConfig({
        test: {
            globalSetup,
            // Vitest reads coverage only from the root, so a block on either project is ignored
            coverage: {
                ...coverage,
                exclude: [...(coverage?.exclude ?? []), ...coverageExclude],
                thresholds,
            },
            projects: [
                {
                    ...nodeConfig,
                    test: {
                        ...nodeTest,
                        name: "node",
                        include: ["shared/**/*.spec.ts", "server/**/*.spec.ts", "tools/**/*.spec.ts", ...nodeSpecs],
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
