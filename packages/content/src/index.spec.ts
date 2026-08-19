import { describe, expect, it } from "vitest";
import * as api from "./index";

// A consumer outside this workspace only ever sees this list, so widening it is a decision rather
// than a side effect of adding a file
describe("package entrypoint", () => {
    it("exports everything consumers build against, and nothing else", () => {
        expect(Object.keys(api).sort()).toEqual([
            "ContentError",
            "ContentProvider",
            "ContentUnavailableError",
            "DEFAULT_PER_PAGE",
            "ENTRY_RESOURCES",
            "MAX_PAGE",
            "MAX_PER_PAGE",
            "MAX_SEARCH_LENGTH",
            "MalformedQueryError",
            "MisconfiguredVendorError",
            "NotFoundError",
            "OfetchHttpClient",
            "TERM_RESOURCES",
            "UndefinedResourceError",
            "UndefinedVendorError",
            "UnsupportedQueryError",
            "UpstreamError",
            "VENDOR_NAMES",
            "contentKey",
            "createProvider",
            "isEntryResource",
            "isTermResource",
            "isVendorName",
        ]);
    });
});
