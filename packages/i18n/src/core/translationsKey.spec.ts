import { describe, expect, it } from "vitest";
import { translationsKey } from "./translationsKey";
import type { VendorConfig } from "./registry";

const internal: VendorConfig = { name: "internal", baseURL: "https://translations.test/", project: "external" };

describe("translationsKey", () => {
    it("keys by vendor, project and locale so tenants never share a payload", () => {
        expect(translationsKey(internal, "en-EN")).toBe("internal:external:en-EN");
    });

    it("keys by vendor options too, since they pick which upstream document is fetched", () => {
        const abc: VendorConfig = { name: "test", baseURL: "https://translations.test/", project: "external", options: { id: "abc" } };
        const xyz: VendorConfig = { ...abc, options: { id: "xyz" } };

        expect(translationsKey(abc, "en-EN")).toBe(`test:external:${encodeURIComponent("{\"id\":\"abc\"}")}:en-EN`);
        expect(translationsKey(xyz, "en-EN")).not.toBe(translationsKey(abc, "en-EN"));
    });

    it("stays safe to use as a storage path", () => {
        const vendor: VendorConfig = { name: "test", baseURL: "https://translations.test/", project: "external", options: { id: "a/b?c" } };

        expect(translationsKey(vendor, "en-EN")).toMatch(/^[\w%.:-]+$/);
    });
});
