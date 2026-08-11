import { describe, expect, it } from "vitest";
import { TranslationsUnavailableError, UndefinedLocaleError, UndefinedVendorError } from "./errors";

describe("translation errors", () => {
    it("reports an unreachable vendor as a bad gateway", () => {
        const error = new TranslationsUnavailableError("en-EN");

        expect(error.statusCode).toBe(502);
        expect(error.statusMessage).toContain("en-EN");
    });

    it("reports a misconfigured vendor as an internal error", () => {
        expect(new UndefinedVendorError().statusCode).toBe(500);
    });

    it("reports an unknown locale as not found", () => {
        const error = new UndefinedLocaleError("zz");

        expect(error.statusCode).toBe(404);
        expect(error.statusMessage).toContain("zz");
    });

    it("survives a missing locale without throwing", () => {
        expect(new UndefinedLocaleError().statusCode).toBe(404);
    });

    it.each([
        new TranslationsUnavailableError("en-EN"),
        new UndefinedVendorError(),
        new UndefinedLocaleError("zz"),
    ])("is throwable through h3 as $statusCode", (error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(error.statusMessage);
    });
});
