import {
    configDefaults,
    coverageConfigDefaults,
    defineConfig,
} from "vitest/config";

function createNodeConfig() {
    return defineConfig({
        test: {
            globals: false,
            exclude: [...configDefaults.exclude, "dist/**/*"],
            coverage: {
                provider: "v8",
                include: ["src/**/*.ts", "lib/**/*.ts", "app/**/*.ts", "server/**/*.ts", "tools/**/*.ts"],
                exclude: [
                    ...coverageConfigDefaults.exclude,
                    "dist/**/*",
                    "**/*.stories.ts",
                ],
                reporter: ["text", "html", "clover", "json", "json-summary", "lcov"],
            },
        },
        plugins: [],
    });
}

export default createNodeConfig;
