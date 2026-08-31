import { describe, expect, it } from "vitest";
import * as api from "./index";

describe("package entrypoint", () => {
    it("exports everything consumers build against", () => {
        expect(Object.keys(api).sort()).toEqual([
            "MisconfiguredVendorError",
            "OfetchHttpClient",
            "TranslationProvider",
            "TranslationsError",
            "TranslationsUnavailableError",
            "UndefinedLocaleError",
            "UndefinedLocaleProviderError",
            "UndefinedVendorError",
            "UpstreamError",
            "VENDOR_NAMES",
            "createProvider",
            "isVendorName",
            "translationsKey",
        ]);
    });
});
