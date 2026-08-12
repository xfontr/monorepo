import { describe, expect, it } from "vitest";
import * as api from "./index";

describe("package entrypoint", () => {
    it("exports everything consumers build against", () => {
        expect(Object.keys(api).sort()).toEqual([
            "OfetchHttpClient",
            "TranslationProvider",
            "TranslationsError",
            "TranslationsUnavailableError",
            "UndefinedLocaleError",
            "UndefinedVendorError",
            "getVendor",
        ]);
    });
});
