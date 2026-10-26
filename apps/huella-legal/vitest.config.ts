import { vitest } from "@monorepo/configs";

export default vitest.createNuxtConfig({
    root: import.meta.dirname,
    setupFiles: ["./vitest.setup.ts"],
    // None of these ship: the lab and Storybook mocks; Playwright covers pages
    coverageExclude: ["app/lab/**", "app/pages/**", "**/__mocks__/**"],
    thresholds: { lines: 90, statements: 90, functions: 85, branches: 80 },
});
