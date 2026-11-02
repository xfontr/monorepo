import { readFileSync } from "node:fs";
import { wordpressHandlers, type WordpressContent } from "@monorepo/content/testing";
import { setupServer } from "msw/node";
import { wordpressCommentHandlers } from "../e2e/vendors.ts";

const baseURL = process.env.NUXT_CONTENT_VENDOR_BASE_URL ?? "";

const content = JSON.parse(
    readFileSync(new URL("./content.json", import.meta.url), "utf8"),
) as WordpressContent;

setupServer(
    ...wordpressCommentHandlers(baseURL, []),
    ...wordpressHandlers(baseURL, content),
).listen({
    onUnhandledFrame: ({ frame, defaults }) => {
        if (frame.protocol !== "http") return;

        const { request } = frame.data as { request: Request };

        if (new URL(request.url).hostname.endsWith("huellalegal.com")) defaults.error();
    },
});
