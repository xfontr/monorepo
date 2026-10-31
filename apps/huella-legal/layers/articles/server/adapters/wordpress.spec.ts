import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({ fetch: vi.fn(), raw: vi.fn() }));

vi.stubGlobal("useRuntimeConfig", () => ({
    content: { vendor: { name: "wordpress", baseURL: "https://cms.test" } },
}));
vi.stubGlobal("$fetch", Object.assign(nitro.fetch, { raw: nitro.raw }));
vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);

const { isOpenForComments, listCommentedPosts, listComments } = await import("./wordpress");

const page = (items: unknown[], totalPages: number) => ({
    _data: items,
    headers: new Headers({ "x-wp-totalpages": String(totalPages) }),
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe("listComments", () => {
    it("reads every page of a post's comments oldest first, at WordPress's ceiling", async () => {
        nitro.raw.mockImplementation((_path: string, { query }: { query: { page: number } }) =>
            Promise.resolve(page([{ id: query.page }], 2)),
        );

        const comments = await listComments({} as never, "42");

        expect(comments).toEqual([{ id: 1 }, { id: 2 }]);
        expect(nitro.raw).toHaveBeenCalledWith("/wp-json/wp/v2/comments", {
            baseURL: "https://cms.test",
            query: expect.objectContaining({ post: "42", order: "asc", per_page: 100, page: 1 }),
        });
    });

    it("reads a post with no comments as empty, though WordPress reports zero pages", async () => {
        nitro.raw.mockResolvedValue(page([], 0));

        await expect(listComments({} as never, "42")).resolves.toEqual([]);
        expect(nitro.raw).toHaveBeenCalledOnce();
    });

    it("answers 502 when WordPress can't be read, keeping the cause", async () => {
        const cause = new Error("fetch failed");

        nitro.raw.mockRejectedValue(cause);

        await expect(listComments({} as never, "42")).rejects.toMatchObject({
            statusCode: 502,
            cause,
        });
    });
});

describe("listCommentedPosts", () => {
    it("names a post once per comment, as a string id", async () => {
        nitro.raw.mockResolvedValue(page([{ post: 7 }, { post: 7 }, { post: 9 }], 1));

        await expect(listCommentedPosts({} as never)).resolves.toEqual(["7", "7", "9"]);
        expect(nitro.raw).toHaveBeenCalledWith(
            "/wp-json/wp/v2/comments",
            expect.objectContaining({ query: expect.objectContaining({ _fields: "post" }) }),
        );
    });
});

describe("isOpenForComments", () => {
    it.each([
        ["open", true],
        ["closed", false],
    ])("reads a post whose comment status is %s as %s", async (status, open) => {
        nitro.fetch.mockResolvedValue({ comment_status: status });

        await expect(isOpenForComments({} as never, "42")).resolves.toBe(open);
        expect(nitro.fetch).toHaveBeenCalledWith("/wp-json/wp/v2/posts/42", {
            baseURL: "https://cms.test",
            query: { _fields: "comment_status" },
        });
    });
});
