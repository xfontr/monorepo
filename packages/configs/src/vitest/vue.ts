import { mergeConfig, type ViteUserConfig } from "vitest/config";
import createNodeVitestConfig from "./node.js";

function createVueConfig(viteConfig: ViteUserConfig) {
    return mergeConfig(
        viteConfig,
        mergeConfig(createNodeVitestConfig(), {
            test: { environment: "happy-dom" },
        }),
    );
}

export default createVueConfig;
