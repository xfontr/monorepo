import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
    css: [fileURLToPath(new URL("./app/assets/workflows.css", import.meta.url))],

    runtimeConfig: {
        workflowsDir: resolve(import.meta.dirname, "../../../../docs/workflows"),
    },
});
