import { describe, expect, it } from "vitest";
import { translationsKey } from "./translationsKey";
import type { VendorConfig } from "./registry";

const baseURL = "https://translations.test/";
const internal: VendorConfig = { name: "internal", baseURL, project: "external" };

// What Nitro does to a custom cache key before storing it — `escapeKey` in its cache runtime
function escapeKey(key: string): string {
    return key.replace(/\W/g, "");
}

describe("translationsKey", () => {
    it("names the vendor and the locale, so nothing has to be decoded to read a key", () => {
        expect(translationsKey(internal, "en-GB")).toMatch(/^internal_en_dGB_\w+$/);
    });

    it("keys by vendor, project and locale so tenants never share a payload", () => {
        const other: VendorConfig = { ...internal, project: "internal" };

        expect(translationsKey(internal, "en-GB")).not.toBe(translationsKey(other, "en-GB"));
        expect(translationsKey(internal, "en-GB")).not.toBe(translationsKey(internal, "es-ES"));
    });

    it("keys the same request the same way, so a second request is a cache hit", () => {
        expect(translationsKey(internal, "en-GB")).toBe(translationsKey({ ...internal }, "en-GB"));
    });

    it("keys by base URL, so two environments sharing one cache cannot serve each other's messages", () => {
        const staging: VendorConfig = { ...internal, baseURL: "https://staging.translations.test/" };

        expect(translationsKey(staging, "en-GB")).not.toBe(translationsKey(internal, "en-GB"));
    });

    // Hashed whole rather than listed, so this holds without translationsKey being edited
    it("keys off every field of the vendor config, so a field added to it cannot be forgotten here", () => {
        const scoped = { ...internal, environment: "staging" } as unknown as VendorConfig;

        expect(translationsKey(scoped, "en-GB")).not.toBe(translationsKey(internal, "en-GB"));
    });

    it("ignores vendor options, so a rotated credential neither leaks into the key nor busts the cache", () => {
        const vendor: VendorConfig = { name: "tolgee", baseURL, project: "1", options: { token: "secret" } };

        expect(translationsKey(vendor, "en-GB")).not.toContain("secret");
        expect(translationsKey({ ...vendor, options: { token: "rotated" } }, "en-GB")).toBe(translationsKey(vendor, "en-GB"));
    });

    // Nitro strips every non-word character out of the key, so anything else here is silently lost
    it("is word characters only, so the key that is stored is the key that was built", () => {
        const vendor: VendorConfig = { name: "tolgee", baseURL, project: "a/b?c", options: { token: "t" } };
        const key = translationsKey(vendor, "en-GB");

        expect(key).toMatch(/^\w+$/);
        expect(escapeKey(key)).toBe(key);
    });

    // Compared after that strip, not before: two base URLs differing only in punctuation used to
    // collapse onto one entry
    it("survives the strip, so punctuation is not what keeps two documents apart", () => {
        const a: VendorConfig = { ...internal, baseURL: "https://a.test/" };
        const b: VendorConfig = { ...internal, baseURL: "https://at.est/" };

        expect(escapeKey(translationsKey(a, "en-GB"))).not.toBe(escapeKey(translationsKey(b, "en-GB")));
    });
});
