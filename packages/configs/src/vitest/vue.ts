import { mergeConfig } from "vitest/config";
import createNodeVitestConfig from "./node.ts";

function createVueConfig(viteConfig: object) {
    return mergeConfig(
        viteConfig,
        mergeConfig(createNodeVitestConfig(), {
            test: {
                environment: "happy-dom",
                // The caller's Vite config brings the Vue plugin, so an SFC can be instrumented
                // here — which is why the node preset's own `include` leaves `.vue` out.
                coverage: { include: ["src/**/*.vue", "lib/**/*.vue", "app/**/*.vue"] },
            },
        }),
    );
}

export default createVueConfig;
