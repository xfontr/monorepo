import { defineVitestProject } from "@nuxt/test-utils/config";
import { vitest } from "@monorepo/configs";
import { defineConfig } from "vitest/config";

const nodeConfig = vitest.createNodeConfig();
const appRoot = import.meta.dirname;
const { globalSetup, ...nodeTestConfig } = nodeConfig.test ?? {};

const nuxtConfig = await defineVitestProject({
    root: appRoot,
    test: {
        name: "nuxt",
        fileParallelism: false,
        include: ["app/**/*.spec.ts"],
        exclude: ["app/utils/**/*.spec.ts", "app/composables/useSnapshot.spec.ts"],
        environmentOptions: {
            nuxt: {
                rootDir: appRoot,
                domEnvironment: "happy-dom",
            },
        },
        coverage: nodeConfig.test?.coverage,
    },
});

export default defineConfig({
    test: {
        globalSetup,
        projects: [
            {
                ...nodeConfig,
                test: {
                    ...nodeTestConfig,
                    name: "node",
                    include: [
                        "shared/**/*.spec.ts",
                        "server/**/*.spec.ts",
                        "tools/**/*.spec.ts",
                        "app/utils/**/*.spec.ts",
                        "app/composables/useSnapshot.spec.ts",
                    ],
                },
            },
            nuxtConfig,
        ],
    },
});
