import { vitest } from "@monorepo/configs";

export default vitest.createNuxtConfig({
    root: import.meta.dirname,
    setupFiles: ["./vitest.setup.ts"],
    // The lab never ships, and Playwright covers pages
    coverageExclude: ["app/lab/**", "app/pages/**"],
    thresholds: { lines: 90, statements: 90, functions: 85, branches: 80 },
});
