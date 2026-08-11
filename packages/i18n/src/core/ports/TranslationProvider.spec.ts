import { describe, expect, it, vi } from "vitest";
import TranslationProvider from "./TranslationProvider";
import type { HttpClient } from "./HttpClient";

const vendor = { baseURL: "https://translations.test/", project: "external", options: { id: "abc" } };

describe("TranslationProvider", () => {
    it("exposes the vendor configuration to its subclasses", () => {
        const provider = new TranslationProvider(vendor);

        expect(provider.baseURL).toBe(vendor.baseURL);
        expect(provider.project).toBe(vendor.project);
        expect(provider.options).toEqual(vendor.options);
    });

    it("refuses to answer until a vendor implements the fetch", () => {
        expect(() => new TranslationProvider(vendor).getTranslations("en-EN")).toThrow();
    });

    it("returns itself from setHttpClient so callers can chain", () => {
        const provider = new TranslationProvider(vendor);
        const http: HttpClient = { get: vi.fn() };

        expect(provider.setHttpClient(http)).toBe(provider);
    });
});
