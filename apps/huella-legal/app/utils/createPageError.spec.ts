import { describe, expect, it } from "vitest";
import { createPageError } from "./createPageError";

// Shaped like ofetch's FetchError, wrapped the way useAsyncData wraps it before it reaches error.value
function fetchFailure(fields: { statusCode?: number, statusMessage?: string, data?: unknown, response?: unknown, cause?: Error }) {
    const { cause, ...rest } = fields;

    return createError(Object.assign(new Error("[GET] \"/api/articles/la-culpa\": fetch failed", { cause }), rest));
}

const NOT_FOUND = fetchFailure({ statusCode: 404, statusMessage: "Not found", data: { slug: "la-culpa" }, response: { status: 404 } });
const UNANSWERED = fetchFailure({ cause: new TypeError("fetch failed") });

describe("createPageError", () => {
    it("keeps the route's status, so a missing post renders the not-found page", () => {
        expect(createPageError(NOT_FOUND)).toMatchObject({ status: 404, statusText: "Not found", fatal: true });
    });

    it("answers a request that never got a response as a bad gateway, not a 500 of ours", () => {
        expect(createPageError(UNANSWERED)).toMatchObject({ status: 502, fatal: true });
    });

    it("keeps the failure's message, data and stack, so telemetry points at the fetch and not at the page", () => {
        const error = createPageError(NOT_FOUND);

        expect(error).toMatchObject({ message: NOT_FOUND.message, data: { slug: "la-culpa" }, stack: NOT_FOUND.stack });
        expect(error.cause).toBe(NOT_FOUND);
    });
});
