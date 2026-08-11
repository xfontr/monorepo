import { describe, expect, it } from "vitest";
import { TranslationsError, TranslationsUnavailableError, UndefinedLocaleError, UndefinedVendorError } from "./errors";

describe("translation errors", () => {
    it("reports an unreachable vendor as a bad gateway", () => {
        const error = new TranslationsUnavailableError("en-EN");

        expect(error.statusCode).toBe(502);
        expect(error.statusMessage).toContain("en-EN");
    });

    it("reports a misconfigured vendor as an internal error, naming the registered vendors", () => {
        const error = new UndefinedVendorError("nope", ["internal", "test"]);

        expect(error.statusCode).toBe(500);
        expect(error.statusMessage).toContain("nope");
        expect(error.statusMessage).toContain("internal, test");
    });

    it("survives a missing vendor without throwing", () => {
        expect(new UndefinedVendorError(undefined, ["internal"]).statusCode).toBe(500);
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
        new UndefinedVendorError("nope", ["internal", "test"]),
        new UndefinedLocaleError("zz"),
    ])("is throwable through h3 as $statusCode", (error) => {
        expect(error).toBeInstanceOf(TranslationsError);
        expect(error.message).toBe(error.statusMessage);
        expect(error.name).toBe(error.constructor.name);
    });

    it("keeps the original failure as the cause", () => {
        const cause = new Error("upstream down");

        expect(new TranslationsUnavailableError("en-EN", cause).cause).toBe(cause);
    });
});
