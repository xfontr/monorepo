import { setupServer } from "msw/node";
import { ofetch } from "ofetch";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OfetchHttpClient } from "#core/adapters/clients/OfetchHttpClient";
import type { Entry, Term } from "#core/domain/content";
import { NotFoundError, UpstreamError } from "#core/domain/errors";
import createProvider from "#core/registry";
import { fakeEntry } from "./factories";
import { wordpressHandlers } from "./wordpress";

const BASE_URL = "https://cms.test/blog";

const CIVIL: Term = { id: "9", resource: "categories", slug: "civil", name: "Civil", description: "Contracts and family", seo: { title: "Civil", noindex: true } };
const PRECEDENT: Term = { id: "12", resource: "tags", slug: "precedent", name: "Precedent" };

const POSTS: Entry[] = ["1", "2", "3"].map((id) => ({
    id,
    slug: `post-${id}`,
    title: `Post ${id}`,
    excerpt: { format: "html", value: `<p>Summary ${id}</p>` },
    body: { format: "html", value: `<p>Body ${id}</p>` },
    publishedAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-02-02T09:00:00Z",
    image: { id: "40", url: "https://cms.test/cover.jpg", alt: "Cover", width: 1200, height: 630 },
    terms: [CIVIL, PRECEDENT],
    authors: [{ id: "5", slug: "irene", name: "Irene Valdés", bio: "Civil lawyer", avatar: { id: "41", url: "https://cms.test/irene.jpg", alt: "Irene Valdés" } }],
    seo: { title: `Post ${id} | Blog`, description: `About post ${id}`, noindex: false },
}));

const BARE_PAGE: Entry = { id: "7", slug: "about", title: "About", body: { format: "html", value: "<p>About us</p>" }, terms: [], authors: [] };

const GENERATED = fakeEntry({ slug: "generated" });

const server = setupServer(...wordpressHandlers(BASE_URL, { posts: [...POSTS, GENERATED], pages: [BARE_PAGE], categories: [CIVIL] }));

// The real provider on the real client, so the fake is held to what WordpressProvider parses
function provider() {
    return createProvider({ name: "wordpress", baseURL: BASE_URL }, new OfetchHttpClient(ofetch.create({})));
}

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterAll(() => server.close());

describe("the fake WordPress", () => {
    it("round-trips every entry field through the provider unchanged", async () => {
        const page = await (await provider()).listEntries("posts", { page: 2, perPage: 2 });

        expect(page).toEqual({ items: [POSTS[2], GENERATED], page: 2, perPage: 2, total: 4, totalPages: 2 });
    });

    it("round-trips what the factories build, so an app's e2e data is always servable", async () => {
        await expect((await provider()).getEntry("posts", "generated")).resolves.toEqual(GENERATED);
    });

    it("leaves out what an entry doesn't have instead of inventing it", async () => {
        await expect((await provider()).getEntry("pages", "about")).resolves.toEqual(BARE_PAGE);
    });

    it("serves terms under the taxonomy the provider maps back to their resource", async () => {
        const { items } = await (await provider()).listTerms("categories");

        expect(items).toEqual([CIVIL]);
    });

    it("finds an entry by slug, and misses with the provider's own NotFoundError", async () => {
        const wordpress = await provider();

        await expect(wordpress.getEntry("posts", "post-2")).resolves.toEqual(POSTS[1]);
        await expect(wordpress.getEntry("posts", "missing")).rejects.toBeInstanceOf(NotFoundError);
    });

    it("filters entries by term, so a category listing doesn't serve every post", async () => {
        const { items } = await (await provider()).listEntries("posts", { term: { resource: "categories", id: CIVIL.id } });

        expect(items).toEqual(POSTS);
    });

    it("refuses a page past the end with a 400, as WordPress does", async () => {
        const failure = (await provider()).listEntries("posts", { page: 9 });

        await expect(failure).rejects.toBeInstanceOf(UpstreamError);
        await expect(failure).rejects.toMatchObject({ upstreamStatus: 400 });
    });

    it("answers a resource it was given no content for with a 404", async () => {
        await expect((await provider()).listTerms("tags")).rejects.toMatchObject({ upstreamStatus: 404 });
    });
});
