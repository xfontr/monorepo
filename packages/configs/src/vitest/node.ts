import { fileURLToPath } from "node:url";
import {
    configDefaults,
    coverageConfigDefaults,
    defineConfig,
} from "vitest/config";

// A `globalSetup` path resolves against the consuming project's root, never against this file.
const prepareNuxt = fileURLToPath(new URL("./prepareNuxt.mjs", import.meta.url));

function createNodeConfig() {
    return defineConfig({
        test: {
            globals: false,
            exclude: [...configDefaults.exclude, "dist/**/*"],
            // A no-op in any project without a `nuxt.config.ts`.
            globalSetup: [prepareNuxt],
            coverage: {
                provider: "v8",
                include: [
                    "src/**/*.ts",
                    "lib/**/*.ts",
                    "app/**/*.ts",
                    "app/**/*.vue",
                    "server/**/*.ts",
                    "shared/**/*.ts",
                    "tools/**/*.ts",
                ],
                exclude: [
                    ...coverageConfigDefaults.exclude,
                    "dist/**/*",
                    ".nuxt/**/*",
                    ".report/**/*",
                    "coverage/**/*",
                    "**/*.config.ts",
                    "**/*.stories.ts",
                ],
                reporter: ["text", "html", "clover", "json", "json-summary", "lcov"],
            },
        },
        plugins: [],
    });
}

export default createNodeConfig;
