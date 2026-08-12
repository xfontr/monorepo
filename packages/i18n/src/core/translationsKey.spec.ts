import { describe, expect, it } from "vitest";
import { translationsKey } from "./translationsKey";
import type { VendorConfig } from "./registry";

const baseURL = "https://translations.test/";
const internal: VendorConfig = { name: "internal", baseURL, project: "external" };

describe("translationsKey", () => {
    it("keys by vendor, project and locale so tenants never share a payload", () => {
        expect(translationsKey(internal, "en-GB")).toBe(`internal:external:${encodeURIComponent(baseURL)}:en-GB`);
    });

    it("keys by vendor options too, since they pick which upstream document is fetched", () => {
        const abc: VendorConfig = { name: "tolgee", baseURL, project: "external", options: { token: "t", projectId: "abc" } };
        const xyz: VendorConfig = { ...abc, options: { ...abc.options, projectId: "xyz" } };

        expect(translationsKey(abc, "en-GB")).toContain(encodeURIComponent(JSON.stringify(abc.options)));
        expect(translationsKey(xyz, "en-GB")).not.toBe(translationsKey(abc, "en-GB"));
    });

    it("keys by base URL, so two environments sharing one cache cannot serve each other's messages", () => {
        const staging: VendorConfig = { ...internal, baseURL: "https://staging.translations.test/" };

        expect(translationsKey(staging, "en-GB")).not.toBe(translationsKey(internal, "en-GB"));
    });

    it("stays safe to use as a storage path", () => {
        const vendor: VendorConfig = { name: "tolgee", baseURL, project: "external", options: { token: "t", projectId: "a/b?c" } };

        expect(translationsKey(vendor, "en-GB")).toMatch(/^[\w%.:-]+$/);
    });
});
