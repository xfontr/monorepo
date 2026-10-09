import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentRouteError } from "../errors";

const nitro = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.stubGlobal("$fetch", nitro.fetch);

const { fetchContent } = await import("./fetchContent");

beforeEach(() => {
    vi.clearAllMocks();
});

describe("fetchContent", () => {
    it("returns what the content route answered, with the query passed on", async () => {
        nitro.fetch.mockResolvedValue({ items: [] });

        expect(await fetchContent("/api/content/posts", { query: { perPage: 4 } })).toEqual({ items: [] });
        expect(nitro.fetch).toHaveBeenCalledWith("/api/content/posts", { query: { perPage: 4 } });
    });

    it("never surfaces a transport-specific error", async () => {
        const cause = Object.assign(new Error("404"), { response: { status: 404 } });
        nitro.fetch.mockRejectedValue(cause);

        await expect(fetchContent("/api/content/posts/x")).rejects.toThrow(ContentRouteError);
        await expect(fetchContent("/api/content/posts/x")).rejects.toMatchObject({ statusCode: 404, cause });
    });
});
