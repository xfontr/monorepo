import { mergeConfig } from "vitest/config";
import createNodeVitestConfig from "./node.ts";

function createVueConfig(viteConfig: object) {
    return mergeConfig(
        viteConfig,
        mergeConfig(createNodeVitestConfig(), {
            test: { environment: "happy-dom" },
        }),
    );
}

export default createVueConfig;
