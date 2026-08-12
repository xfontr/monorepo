import { describe, expect, it, vi } from "vitest";
import TranslationProvider from "./TranslationProvider";
import type { HttpClient } from "./HttpClient";
import type { TranslationMap } from "../domain/translations";

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
});
