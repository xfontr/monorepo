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
                exclude: [
                    ...coverageConfigDefaults.exclude,
                    "dist/**/*",
                ],
                reporter: ["text", "html", "clover", "json", "lcov"],
            },
        },
        plugins: [],
    });
}

export default createNodeConfig;
