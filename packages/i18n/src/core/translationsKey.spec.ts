import { describe, expect, it } from "vitest";
import { translationsKey } from "./translationsKey";
import type { VendorConfig } from "./registry";

const baseURL = "https://translations.test/";
const internal: VendorConfig = { name: "internal", baseURL, project: "external" };

// What Nitro's cached handler does to a custom key before storing it, so the guarantees below are
// asserted where they actually have to hold
function asStored(key: string): string {
    return key.replace(/\W/g, "");
}

describe("translationsKey", () => {
    it("keys by vendor, project and locale so tenants never share a payload", () => {
        const other: VendorConfig = { ...internal, project: "internal" };

        expect(asStored(translationsKey(internal, "en-GB"))).not.toBe(asStored(translationsKey(other, "en-GB")));
        expect(asStored(translationsKey(internal, "en-GB"))).not.toBe(asStored(translationsKey(internal, "es-ES")));
    });

    it("keys the same request the same way, so a second request is a cache hit", () => {
        expect(translationsKey(internal, "en-GB")).toBe(translationsKey({ ...internal }, "en-GB"));
    });

    it("ignores vendor options, so a rotated credential neither leaks into the key nor busts the cache", () => {
        const vendor: VendorConfig = { name: "tolgee", baseURL, project: "1", options: { token: "secret" } };

        expect(translationsKey(vendor, "en-GB")).not.toContain("secret");
        expect(translationsKey({ ...vendor, options: { token: "rotated" } }, "en-GB")).toBe(translationsKey(vendor, "en-GB"));
    });

    it("keys by base URL, so two environments sharing one cache cannot serve each other's messages", () => {
        const staging: VendorConfig = { ...internal, baseURL: "https://staging.translations.test/" };

        expect(asStored(translationsKey(staging, "en-GB"))).not.toBe(asStored(translationsKey(internal, "en-GB")));
    });

    // Nitro strips the separators and the percent-encoding, so two base URLs that differ only in
    // punctuation used to collapse onto one entry
    it("survives that stripping, so punctuation is not what keeps two documents apart", () => {
        const a: VendorConfig = { ...internal, baseURL: "https://a.test/" };
        const b: VendorConfig = { ...internal, baseURL: "https://at.est/" };

        expect(asStored(translationsKey(a, "en-GB"))).not.toBe(asStored(translationsKey(b, "en-GB")));
    });

    it("stays safe to use as a storage path", () => {
        const vendor: VendorConfig = { name: "tolgee", baseURL, project: "a/b?c", options: { token: "t" } };

        expect(translationsKey(vendor, "en-GB")).toMatch(/^[\w%.:-]+$/);
    });

    it("stays traceable to the vendor and locale it was built for", () => {
        expect(translationsKey(internal, "en-GB")).toMatch(/^internal:en-GB:/);
    });
});
