import { beforeEach, describe, expect, it, vi } from "vitest";
import { useContent } from "./useContent";
import { CONTENT_API_PATH } from "#nuxt/config";

const $fetch = vi.fn();

const noQuery = {
    page: undefined,
    perPage: undefined,
    slug: undefined,
    search: undefined,
    term: undefined,
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("$fetch", $fetch);
    // The composable's own concern is which route it calls and with what key, not what Nuxt does
    // with either one — so the stub just runs the handler and hands back its key.
    vi.stubGlobal("useAsyncData", (key: () => string, handler: () => Promise<unknown>) => handler().then((data) => ({ data, key: key() })));
    $fetch.mockResolvedValue({ items: [], page: 1, perPage: 10, total: 0, totalPages: 0 });
});

describe("useContent", () => {
    it("lists entries on the route the module mounts", async () => {
        await useContent().listEntries("posts", () => ({ page: 2, perPage: 6 }));

        expect($fetch).toHaveBeenCalledWith(`${CONTENT_API_PATH}/posts`, {
            query: { ...noQuery, page: 2, perPage: 6 },
        });
    });

    it("lists terms on the same route", async () => {
        await useContent().listTerms("categories");

        expect($fetch).toHaveBeenCalledWith(`${CONTENT_API_PATH}/categories`, { query: noQuery });
    });

    // The server parses `<taxonomy>:<id>` back, so the two halves have to agree on the separator
    it("sends a term filter in the form the route parses", async () => {
        await useContent().listEntries("posts", () => ({ term: { resource: "categories", id: "12" } }));

        expect($fetch).toHaveBeenCalledWith(`${CONTENT_API_PATH}/posts`, {
            query: { ...noQuery, term: "categories:12" },
        });
    });

    // Two pages of the same resource are two different documents, so a key that ignored the query
    // would serve page one's list back for every page
    it("keys a list by its resource and query, not just its resource", async () => {
        const { key: keyOne } = await useContent().listEntries("posts", () => ({ page: 1 })) as { key: string };
        const { key: keyTwo } = await useContent().listEntries("posts", () => ({ page: 2 })) as { key: string };

        expect(keyOne).not.toBe(keyTwo);
    });

    // The slug is the whole address of a document, so the route needs no query at all
    it("asks for a single entry by slug, with nothing a document has no use for", async () => {
        await useContent().getEntry("posts", () => "hello-world");

        expect($fetch).toHaveBeenCalledWith(`${CONTENT_API_PATH}/posts/hello-world`);
    });

    it("asks for a single term the same way", async () => {
        await useContent().getTerm("categories", () => "news");

        expect($fetch).toHaveBeenCalledWith(`${CONTENT_API_PATH}/categories/news`);
    });

    // A key that stopped at the resource would serve one document back under every other's key
    it("keys an item by its slug, not just its resource", async () => {
        const { key: keyOne } = await useContent().getEntry("posts", () => "hello-world") as { key: string };
        const { key: keyTwo } = await useContent().getEntry("posts", () => "other") as { key: string };

        expect(keyOne).not.toBe(keyTwo);
    });

    // The route decodes the param back, so an accented slug survives the round trip
    it.each([
        ["programación", "programaci%C3%B3n"],
        ["hello world", "hello%20world"],
        ["a/b", "a%2Fb"],
    ])("encodes %o into the path as %s", async (slug, encoded) => {
        await useContent().getEntry("posts", () => slug);

        expect($fetch).toHaveBeenCalledWith(`${CONTENT_API_PATH}/posts/${encoded}`);
    });

    // A NotFoundError thrown in the browser carries a status nothing reads and will not render an
    // error page, so the server's own 404 is what reaches the caller through `useAsyncData`'s error
    it("relays the route's failure rather than inventing one of its own", async () => {
        const cause = Object.assign(new Error("Not Found"), { statusCode: 404 });
        $fetch.mockRejectedValue(cause);

        await expect(useContent().getEntry("posts", () => "nope")).rejects.toBe(cause);
    });
});
