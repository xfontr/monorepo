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
                // Without an explicit include, v8 only instruments files a test actually imported,
                // so a file with zero tests just vanishes from the report instead of counting as
                // 0% — coverage looks better the less of a package is tested. `.vue` is left out on
                // purpose: this preset has no Vue transform, so an SFC here fails to parse and is
                // dropped. `createVueConfig` adds it back once the caller's Vite config is in.
                include: ["src/**/*.ts", "lib/**/*.ts", "app/**/*.ts", "server/**/*.ts"],
                // The v8 provider's own built-in excludes already cover *.spec.ts and config files;
                // *.stories.ts is the one source pattern in this workspace they don't know about.
                exclude: [
                    ...coverageConfigDefaults.exclude,
                    "dist/**/*",
                    "**/*.stories.ts",
                ],
                reporter: ["text", "html", "clover", "json", "lcov"],
            },
        },
        plugins: [],
    });
}

export default createNodeConfig;
