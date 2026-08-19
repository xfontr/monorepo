import { describe, expect, it, vi } from "vitest";
import createProvider, { isVendorName, VENDOR_NAMES, type VendorConfig } from "./registry";
import WordpressProvider from "./adapters/providers/wordpress/WordpressProvider";
import { MisconfiguredVendorError, UndefinedVendorError } from "./domain/errors";
import type { HttpClient } from "./ports/HttpClient";

const get = vi.fn().mockResolvedValue({ data: [], headers: new Headers() });
const http: HttpClient = { get };

const wordpress: VendorConfig = { name: "wordpress", baseURL: "https://wp.test/" };

describe("createProvider", () => {
    it("builds the provider the config names, from that vendor's own config", async () => {
        const provider = await createProvider(wordpress, http);

        expect(provider).toBeInstanceOf(WordpressProvider);
        expect(provider.config).toEqual(wordpress);
    });

    it("hands the transport to the provider, so it can never be built unable to fetch", async () => {
        const provider = await createProvider(wordpress, http);

        await provider.listEntries("posts");

        expect(get).toHaveBeenCalled();
    });

    it("rejects an unregistered vendor name instead of returning a broken provider", async () => {
        const vendor = { name: "contentful", baseURL: "https://wp.test/" } as unknown as VendorConfig;

        await expect(createProvider(vendor, http)).rejects.toThrow(UndefinedVendorError);
        await expect(createProvider(vendor, http)).rejects.toThrow(/"contentful".*wordpress/);
    });

    it.each<unknown>([undefined, null, {}])("rejects %o as config the same way", async (vendor) => {
        await expect(createProvider(vendor as VendorConfig, http)).rejects.toThrow(UndefinedVendorError);
    });

    // Unset env vars used to reach the vendor as an empty base URL and come back as a 502
    it("rejects a registered vendor whose config cannot work, rather than returning it", async () => {
        await expect(createProvider({ name: "wordpress", baseURL: "" }, http)).rejects.toThrow(MisconfiguredVendorError);
        await expect(createProvider({ name: "wordpress", baseURL: "" }, http)).rejects.toThrow(/baseURL is not an absolute URL/);
    });
});

// The registry drives both the runtime lookup and the config type, so these cannot be allowed to drift
describe("the registered vendors", () => {
    it("are the ones the config type offers", () => {
        expect(VENDOR_NAMES).toEqual(["wordpress"]);
    });

    it.each(VENDOR_NAMES)("recognise %s as a vendor name", (name) => {
        expect(isVendorName(name)).toBe(true);
    });

    it.each([undefined, "", "  ", "WORDPRESS", "wordpres", "contentful"])("do not recognise %o", (name) => {
        expect(isVendorName(name)).toBe(false);
    });
});
