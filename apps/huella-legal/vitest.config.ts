import { vitest } from "@monorepo/configs";

// A tracker ID in a local .env boots the cookie banner in every spec, and dotenv never overrides
// a var that is already set
process.env.NUXT_PUBLIC_TRACKERS_GOOGLE_ANALYTICS_ID = "";

export default vitest.createNuxtConfig({
    root: import.meta.dirname,
    setupFiles: ["./vitest.setup.ts"],
    // None of these ship: the lab and Storybook mocks; Playwright covers pages
    coverageExclude: ["app/lab/**", "**/app/pages/**", "**/__mocks__/**"],
    thresholds: { lines: 90, statements: 90, functions: 85, branches: 80 },
});
