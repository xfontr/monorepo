import { playwright } from "@monorepo/configs";

export default playwright.createConfig({
    port: 4310,
    command: "node --import ./e2e/server.ts .output/server/index.mjs",
    // Nothing listens on these: the preloaded fakes answer them inside the server process
    env: {
        NUXT_CONTENT_VENDOR_BASE_URL: "http://localhost/wordpress",
        NUXT_TRANSLATIONS_VENDOR_BASE_URL: "http://localhost/tolgee",
        NUXT_TRANSLATIONS_VENDOR_PROJECT: "huella-legal",
        // TolgeeProvider refuses an empty token
        NUXT_TRANSLATIONS_VENDOR_OPTIONS_TOKEN: "e2e",
        NUXT_PUBLIC_SITE_URL: "http://localhost:4310",
        NUXT_PUBLIC_OBSERVABILITY_URL: "",
        NUXT_OBSERVABILITY_URL: "",
    },
});
