import { mergeConfig } from "vitest/config";
import createNodeVitestConfig from "./node";

function createVueConfig() {
    return mergeConfig(createNodeVitestConfig(), {
        test: { environment: "happy-dom" },
    });
}

export default createVueConfig;
