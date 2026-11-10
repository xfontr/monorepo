import { resolve } from "node:path";

export default defineNuxtConfig({
    runtimeConfig: {
        // Absolute, because the server that reads it is bundled somewhere else entirely.
        snapshotDir: resolve(import.meta.dirname, "../../.report"),
    },
});
