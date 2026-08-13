import { describe, expect, it } from "vitest";
import { translationsKey } from "./translationsKey";
import type { VendorConfig } from "./registry";

const baseURL = "https://translations.test/";
const internal: VendorConfig = { name: "internal", baseURL, project: "external" };

describe("translationsKey", () => {
    it("keys by vendor, project and locale so tenants never share a payload", () => {
        expect(translationsKey(internal, "en-GB")).toBe(`internal:external:${encodeURIComponent(baseURL)}:en-GB`);
    });

    it("ignores vendor options, so a rotated credential neither leaks into the key nor busts the cache", () => {
        const vendor: VendorConfig = { name: "tolgee", baseURL, project: "1", options: { token: "secret" } };

        expect(translationsKey(vendor, "en-GB")).not.toContain("secret");
        expect(translationsKey({ ...vendor, options: { token: "rotated" } }, "en-GB")).toBe(translationsKey(vendor, "en-GB"));
    });

    it("keys by base URL, so two environments sharing one cache cannot serve each other's messages", () => {
        const staging: VendorConfig = { ...internal, baseURL: "https://staging.translations.test/" };

        expect(translationsKey(staging, "en-GB")).not.toBe(translationsKey(internal, "en-GB"));
    });

    it("stays safe to use as a storage path", () => {
        const vendor: VendorConfig = { name: "tolgee", baseURL, project: "a/b?c", options: { token: "t" } };

        expect(translationsKey(vendor, "en-GB")).toMatch(/^[\w%.:-]+$/);
    });
});
