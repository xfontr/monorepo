import { describe, expect, it } from "vitest";
import { contentKey } from "./contentKey";
import type { VendorConfig } from "./registry";

const vendor: VendorConfig = { name: "wordpress", baseURL: "https://wp.test/" };

// What Nitro does to a custom cache key before storing it — `escapeKey` in its cache runtime
function escapeKey(key: string): string {
    return key.replace(/\W/g, "");
}

describe("contentKey", () => {
    it("names the vendor and the resource, so nothing has to be decoded to read a key", () => {
        expect(contentKey(vendor, "posts", { page: 2 })).toMatch(/^wordpress_posts_\w+_\w+$/);
    });

    it("separates the resources of one vendor", () => {
        expect(contentKey(vendor, "posts")).not.toBe(contentKey(vendor, "pages"));
    });

    // Vendor config carries identity as readily as credentials — a Contentful environment lives there too
    it("separates two deployments of the same vendor", () => {
        const staging: VendorConfig = { ...vendor, baseURL: "https://staging.wp.test/" };

        expect(contentKey(staging, "posts")).not.toBe(contentKey(vendor, "posts"));
    });

    // Nitro turns a key into a filesystem path or a KV entry, so config is hashed rather than listed
    it("hashes the vendor config instead of spelling it out", () => {
        const authenticated = { ...vendor, token: "s3cret" } as unknown as VendorConfig;

        expect(contentKey(authenticated, "posts")).not.toContain("s3cret");
        expect(contentKey(vendor, "posts")).not.toContain("wp.test");
    });

    // Nitro strips every non-word character out of the key, so anything else here is silently lost
    it("is word characters only, so the key that is stored is the key that was built", () => {
        const query = { slug: "a/b?c#d", search: "100% of it" };
        const key = contentKey(vendor, "posts", query);

        expect(key).toMatch(/^\w+$/);
        expect(escapeKey(key)).toBe(key);
    });

    describe("the query half", () => {
        it("orders the axes, so two callers writing the same query in a different order share an entry", () => {
            const key = contentKey(vendor, "posts", { page: 2, perPage: 10, slug: "hello" });

            expect(contentKey(vendor, "posts", { slug: "hello", perPage: 10, page: 2 })).toBe(key);
        });

        it("ignores an axis nobody asked for, so an explicit undefined cannot split the cache", () => {
            expect(contentKey(vendor, "posts", { page: 2, search: undefined })).toBe(contentKey(vendor, "posts", { page: 2 }));
        });

        it.each([
            ["page", { page: 2 }, { page: 3 }],
            ["perPage", { perPage: 10 }, { perPage: 20 }],
            ["slug", { slug: "a" }, { slug: "b" }],
            ["search", { search: "a" }, { search: "b" }],
        ])("separates entries by %s, so changing it cannot serve the previous one's page", (_, left, right) => {
            expect(contentKey(vendor, "posts", left)).not.toBe(contentKey(vendor, "posts", right));
        });

        it("flattens a term filter into one axis", () => {
            const key = contentKey(vendor, "posts", { term: { resource: "categories", id: "12" } });

            expect(key).not.toBe(contentKey(vendor, "posts", { term: { resource: "tags", id: "12" } }));
            expect(key).not.toBe(contentKey(vendor, "posts", { term: { resource: "categories", id: "13" } }));
        });

        // Compared after Nitro's strip, not before: a key that only separates its axes with
        // characters the strip deletes reads as canonical here and collides in storage
        it.each([
            ["one axis spelled into another axis's value", { search: "b", slug: "a" }, { search: "bsluga" }],
            ["a percent escape", { search: "100% of it" }, { search: "1002520of20it" }],
            ["a separator", { slug: "a", search: "b" }, { slug: "a,search=b" }],
        ])("cannot be made to collide with a different query by %s", (_, honest, crafted) => {
            expect(escapeKey(contentKey(vendor, "posts", crafted)))
                .not.toBe(escapeKey(contentKey(vendor, "posts", honest)));
        });

        it("keys an unqueried resource, so a list with no query still gets one entry of its own", () => {
            expect(contentKey(vendor, "categories")).toBe(contentKey(vendor, "categories", {}));
        });
    });
});
