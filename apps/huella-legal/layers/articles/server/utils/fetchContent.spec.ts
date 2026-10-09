import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.stubGlobal("$fetch", nitro.fetch);
vi.stubGlobal("createError", (input: object) => Object.assign(new Error("http"), input));

const { fetchContent } = await import("./fetchContent");

beforeEach(() => {
    vi.clearAllMocks();
});

describe("fetchContent", () => {
    it("returns what the content route answered, with the query passed on", async () => {
        nitro.fetch.mockResolvedValue({ items: [] });

        expect(await fetchContent("/api/content/posts", { perPage: 4 })).toEqual({ items: [] });
        expect(nitro.fetch).toHaveBeenCalledWith("/api/content/posts", { query: { perPage: 4 } });
    });

    // The content module already turned a vendor failure into the status the page should render
    it.each([400, 404, 502])("keeps the route's %i and its message", async (status) => {
        const cause = Object.assign(new Error("[GET] \"/api/content/posts/x\""), { response: { status, statusText: "No \"posts\" found" } });
        nitro.fetch.mockRejectedValue(cause);

        await expect(fetchContent("/api/content/posts/x")).rejects.toMatchObject({ statusCode: status, statusMessage: "No \"posts\" found", cause });
    });

    it("answers a route that never responded as a bad gateway, not a 500 of ours", async () => {
        nitro.fetch.mockRejectedValue(new TypeError("fetch failed"));

        await expect(fetchContent("/api/content/posts/x")).rejects.toMatchObject({ statusCode: 502 });
    });
});
