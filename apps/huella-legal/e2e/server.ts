import { wordpressHandlers } from "@monorepo/content/testing";
import { recordServerConsole } from "@monorepo/configs/playwright/server";
import { tolgeeHandlers } from "@monorepo/i18n/testing";
import { setupServer } from "msw/node";
import { COMMENTS, CONTENT, TRANSLATIONS } from "./fakes.ts";
import { kitHandlers, turnstileHandlers, wordpressCommentHandlers } from "./vendors.ts";

// Preloaded into the built app with `node --import`, so it reads the same vendor URLs the app does
// Ahead of the content package's handlers, whose `/:resource` would answer `/comments` with a 404
setupServer(
    ...wordpressCommentHandlers(process.env.NUXT_CONTENT_VENDOR_BASE_URL ?? "", COMMENTS),
    ...wordpressHandlers(process.env.NUXT_CONTENT_VENDOR_BASE_URL ?? "", CONTENT),
    ...tolgeeHandlers(process.env.NUXT_TRANSLATIONS_VENDOR_BASE_URL ?? "", TRANSLATIONS),
    ...kitHandlers(process.env.NUXT_NEWSLETTER_BASE_URL ?? ""),
    ...turnstileHandlers(),
).listen({ onUnhandledFrame: "error" });

recordServerConsole();
