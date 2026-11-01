import { playwright } from "@monorepo/configs";
import { PAGES } from "./e2e/fakes.ts";

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
        NUXT_NEWSLETTER_BASE_URL: "http://localhost/kit",
        NUXT_NEWSLETTER_API_KEY: "e2e",
        NUXT_NEWSLETTER_FORM_ID: "e2e",
        NUXT_TURNSTILE_SECRET_KEY: "e2e",
        NUXT_PUBLIC_TURNSTILE_SITE_KEY: "e2e",
        NUXT_PUBLIC_SITE_URL: "http://localhost:4310",
        // The build defaults to a preview, which robots.txt and every page keep out of search
        NUXT_SITE_ENV: "production",
        NUXT_PUBLIC_PAGE_SLUGS: JSON.stringify(PAGES.map(({ slug }) => slug)),
        NUXT_PUBLIC_OBSERVABILITY_URL: "",
        NUXT_OBSERVABILITY_URL: "",
    },
});
