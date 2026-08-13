import { describe, expect, it, vi } from "vitest";
import TranslationProvider from "./TranslationProvider";
import type { HttpClient } from "./HttpClient";
import { MisconfiguredVendorError } from "#core/domain/errors";
import type { TranslationMap } from "#core/domain/translations";

const vendor = { baseURL: "https://translations.test/", project: "external", options: { id: "abc" } };

// The port is abstract, so a vendor that forgets getTranslations fails to compile rather than at runtime
class StubProvider extends TranslationProvider<{ id: string }> {
    override getTranslations(): Promise<TranslationMap> {
        return Promise.resolve({});
    }
}

describe("TranslationProvider", () => {
    it("exposes the vendor configuration to its subclasses", () => {
        const http: HttpClient = { get: vi.fn() };
        const provider = new StubProvider(vendor, http);

        expect(provider.baseURL).toBe(vendor.baseURL);
        expect(provider.project).toBe(vendor.project);
        expect(provider.options).toEqual(vendor.options);
    });

    describe("when the vendor config cannot work", () => {
        const http: HttpClient = { get: vi.fn() };

        it.each([
            ["an empty project", { ...vendor, project: "" }, /project is empty/],
            ["a blank project", { ...vendor, project: "   " }, /project is empty/],
            ["an unset base URL", { ...vendor, baseURL: "" }, /baseURL is not an absolute URL/],
            ["a base URL missing its scheme", { ...vendor, baseURL: "app.tolgee.io" }, /baseURL is not an absolute URL/],
        ])("refuses to exist with %s", (_, broken, problem) => {
            expect(() => new StubProvider(broken, http)).toThrow(MisconfiguredVendorError);
            expect(() => new StubProvider(broken, http)).toThrow(problem);
        });

        // One restart per missing variable is the thing worth avoiding
        it("reports every problem at once, naming the provider that cannot be built", () => {
            const broken = { baseURL: "", project: "", options: { id: "abc" } };

            expect(() => new StubProvider(broken, http)).toThrow(/StubProvider is misconfigured/);
            expect(() => new StubProvider(broken, http)).toThrow(/project is empty, baseURL is not an absolute URL/);
        });

        it("reports as an internal error, since the deployment is at fault rather than the vendor", () => {
            expect(() => new StubProvider({ ...vendor, project: "" }, http))
                .toThrow(expect.objectContaining({ statusCode: 500 }) as Error);
        });
    });
});
