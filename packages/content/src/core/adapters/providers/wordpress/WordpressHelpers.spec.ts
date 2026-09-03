import { describe, expect, it } from "vitest";
import { toEntry, toPage, toTerm, toWordpressQuery } from "./WordpressHelpers";
import type { WordpressEntry, WordpressTerm } from "./WordpressTypes";

const entry: WordpressEntry = {
    id: 7,
    slug: "hello-world",
    title: { rendered: "Hello &#8211; World" },
    content: { rendered: "<p>Body</p>" },
    excerpt: { rendered: "<p>Excerpt</p>" },
    date_gmt: "2026-01-02T03:04:05",
    modified_gmt: "2026-01-03T03:04:05",
    _embedded: {
        "wp:featuredmedia": [{
            id: 9,
            source_url: "https://wp.test/image.jpg",
            alt_text: "A photo",
            media_details: { width: 800, height: 600 },
        }],
        "wp:term": [
            [{ id: 3, name: "News", slug: "news", taxonomy: "category" }],
            [{ id: 4, name: "Tips", slug: "tips", taxonomy: "post_tag" }],
        ],
    },
};

function headers(values: Record<string, string> = {}): Headers {
    return new Headers(values);
}

describe("toWordpressQuery", () => {
    it("forwards the axes WordPress names differently", () => {
        expect(toWordpressQuery({ page: 3, perPage: 25, slug: "hello-world", search: "budget" })).toEqual({
            page: 3,
            per_page: 25,
            slug: "hello-world",
            search: "budget",
        });
    });

    it("defaults per_page rather than leaving it to whatever WordPress would otherwise pick", () => {
        expect(toWordpressQuery()).toMatchObject({ per_page: 10 });
    });

    // WordPress returns a 400 above its own ceiling rather than clamping itself
    it("clamps per_page to what WordPress accepts", () => {
        expect(toWordpressQuery({ perPage: 500 })).toMatchObject({ per_page: 100 });
    });
});

describe("toPage", () => {
    it("reports the totals WordPress puts in the headers, and the page that was asked for", () => {
        const result = toPage(
            { data: [entry], headers: headers({ "x-wp-total": "12", "x-wp-totalpages": "2" }) },
            { page: 2, perPage: 6 },
            toEntry,
        );

        expect(result).toMatchObject({ page: 2, perPage: 6, total: 12, totalPages: 2 });
    });

    it("defaults to the first page when none was asked for", () => {
        expect(toPage({ data: [entry], headers: headers() }, undefined, toEntry)).toMatchObject({ page: 1, perPage: 10 });
    });

    // WordPress returns a 400 above its own ceiling rather than clamping itself, so the perPage a
    // Page reports has to be the clamped value, not whatever was asked for
    it("reports the clamped perPage rather than the one that was requested", () => {
        expect(toPage({ data: [entry], headers: headers() }, { perPage: 500 }, toEntry)).toMatchObject({ perPage: 100 });
    });

    // A proxy or plugin can drop these headers or rewrite them into something non-numeric. The empty
    // string matters on its own: Number("") is 0, which would report a populated list as empty.
    it.each<Record<string, string>>([{}, { "x-wp-total": "" }, { "x-wp-total": "  " }, { "x-wp-total": "many" }, { "x-wp-total": "-1" }, { "x-wp-total": "1.5" }])(
        "falls back to what it actually received when the totals arrive as %o",
        (values) => {
            expect(toPage({ data: [entry], headers: headers(values) }, undefined, toEntry)).toMatchObject({ total: 1, totalPages: 1 });
        },
    );

    it("trusts a zero total, which is a real answer rather than a missing one", () => {
        const result = toPage({ data: [], headers: headers({ "x-wp-total": "0", "x-wp-totalpages": "0" }) }, undefined, toEntry);

        expect(result).toMatchObject({ items: [], total: 0, totalPages: 0 });
    });

    it("survives a body that is not a list", () => {
        expect(toPage({ data: null as unknown as WordpressEntry[], headers: headers() }, undefined, toEntry)).toMatchObject({ items: [], total: 0 });
    });
});

describe("toEntry", () => {
    it("reads it into the domain shape, ids as strings", () => {
        expect(toEntry(entry)).toEqual({
            id: "7",
            slug: "hello-world",
            title: "Hello &#8211; World",
            excerpt: { format: "html", value: "<p>Excerpt</p>" },
            body: { format: "html", value: "<p>Body</p>" },
            publishedAt: "2026-01-02T03:04:05Z",
            updatedAt: "2026-01-03T03:04:05Z",
            image: {
                id: "9",
                url: "https://wp.test/image.jpg",
                alt: "A photo",
                width: 800,
                height: 600,
            },
            terms: [
                { id: "3", resource: "categories", slug: "news", name: "News", description: undefined },
                { id: "4", resource: "tags", slug: "tips", name: "Tips", description: undefined },
            ],
        });
    });

    // WordPress reports GMT without a zone designator, so an unsuffixed timestamp parses as local time
    it.each([
        ["2026-01-02T03:04:05", "2026-01-02T03:04:05Z"],
        ["2026-01-02T03:04:05Z", "2026-01-02T03:04:05Z"],
    ])("marks %s as UTC", (date_gmt, expected) => {
        expect(toEntry({ ...entry, date_gmt }).publishedAt).toBe(expected);
    });

    it.each([null, undefined, ""])("omits a date reported as %o", (date_gmt) => {
        const result = toEntry({ ...entry, date_gmt, modified_gmt: date_gmt });

        expect(result.publishedAt).toBeUndefined();
        expect(result.updatedAt).toBeUndefined();
    });

    it("omits an excerpt the vendor did not render", () => {
        expect(toEntry({ ...entry, excerpt: undefined }).excerpt).toBeUndefined();
    });

    // An inaccessible featured image embeds as a REST error object instead of a media item
    it("drops a featured image that came back without a url", () => {
        const result = toEntry({ ...entry, _embedded: { "wp:featuredmedia": [{ id: 9 }] } });

        expect(result.image).toBeUndefined();
    });

    it("omits alt text rather than inventing it, so a decorative image stays decorative", () => {
        const result = toEntry({ ...entry, _embedded: { "wp:featuredmedia": [{ id: 9, source_url: "https://wp.test/i.jpg" }] } });

        expect(result.image).toEqual({ id: "9", url: "https://wp.test/i.jpg", alt: "", width: undefined, height: undefined });
    });

    // An entry embeds every taxonomy the site defines, including custom ones the domain has no name for
    it("drops a taxonomy the domain cannot name, rather than guessing one", () => {
        const result = toEntry({
            ...entry,
            _embedded: { "wp:term": [[{ id: 5, name: "Q1", slug: "q1", taxonomy: "wp_pattern_category" }]] },
        });

        expect(result.terms).toEqual([]);
    });

    it("survives an entry that embeds nothing", () => {
        const result = toEntry({ ...entry, _embedded: undefined });

        expect(result.terms).toEqual([]);
        expect(result.image).toBeUndefined();
    });
});

describe("toTerm", () => {
    const term: WordpressTerm = { id: 3, name: "News", slug: "news", taxonomy: "category", description: "Latest" };

    it("reads it into the domain shape, naming the resource from its taxonomy", () => {
        expect(toTerm(term, "categories")).toEqual({ id: "3", resource: "categories", slug: "news", name: "News", description: "Latest" });
    });

    it("omits an empty description", () => {
        expect(toTerm({ ...term, description: "" }, "categories").description).toBeUndefined();
    });

    // Falls back to what the caller asked for, so a custom taxonomy is never relabelled as a tag
    it("keeps the requested resource when the taxonomy is one the domain cannot name", () => {
        expect(toTerm({ ...term, taxonomy: "quarter" }, "categories").resource).toBe("categories");
    });
});
