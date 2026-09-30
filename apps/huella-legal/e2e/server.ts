import { wordpressHandlers } from "@monorepo/content/testing";
import { tolgeeHandlers } from "@monorepo/i18n/testing";
import { setupServer } from "msw/node";
import { CONTENT, TRANSLATIONS } from "./fakes.ts";

// Preloaded into the built app with `node --import`, so it reads the same vendor URLs the app does
setupServer(
    ...wordpressHandlers(process.env.NUXT_CONTENT_VENDOR_BASE_URL ?? "", CONTENT),
    ...tolgeeHandlers(process.env.NUXT_TRANSLATIONS_VENDOR_BASE_URL ?? "", TRANSLATIONS),
).listen({ onUnhandledFrame: "error" });
