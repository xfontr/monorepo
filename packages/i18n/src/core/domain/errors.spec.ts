import { describe, expect, it } from "vitest";
import { MisconfiguredVendorError, TranslationsError, TranslationsUnavailableError, UndefinedLocaleError, UndefinedLocaleProviderError, UndefinedVendorError } from "./errors";

describe("translation errors", () => {
    it("reports an unreachable vendor as a bad gateway", () => {
        const error = new TranslationsUnavailableError("en-GB");

        expect(error.statusCode).toBe(502);
        expect(error.statusMessage).toContain("en-GB");
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

    it("reports unusable vendor config as an internal error, listing every problem", () => {
        const error = new MisconfiguredVendorError("TolgeeProvider", ["project is empty", "options.token is empty"]);

        expect(error.statusCode).toBe(500);
        expect(error.statusMessage).toBe("TolgeeProvider is misconfigured: project is empty, options.token is empty");
        expect(error.problems).toHaveLength(2);
    });

    it("reports an unknown locale as not found", () => {
        const error = new UndefinedLocaleError("zz");

        expect(error.statusCode).toBe(404);
        expect(error.statusMessage).toContain("zz");
    });

    it("survives a missing locale without throwing", () => {
        expect(new UndefinedLocaleError().statusCode).toBe(404);
    });

    it("reports a locale the vendor does not hold as an internal error, since the config claims it", () => {
        const error = new UndefinedLocaleProviderError("en-GB", "Tolgee");

        expect(error.statusCode).toBe(500);
        expect(error.statusMessage).toContain("en-GB");
        expect(error.statusMessage).toContain("Tolgee");
    });

    it.each([
        new TranslationsUnavailableError("en-GB"),
        new UndefinedVendorError("nope", ["internal", "test"]),
        new MisconfiguredVendorError("TolgeeProvider", ["project is empty"]),
        new UndefinedLocaleError("zz"),
        new UndefinedLocaleProviderError("en-GB", "Tolgee"),
    ])("is throwable through h3 as $statusCode", (error) => {
        expect(error).toBeInstanceOf(TranslationsError);
        expect(error.message).toBe(error.statusMessage);
        expect(error.name).toBe(error.constructor.name);
    });

    it("keeps the original failure as the cause", () => {
        const cause = new Error("upstream down");

        expect(new TranslationsUnavailableError("en-GB", cause).cause).toBe(cause);
    });
});
