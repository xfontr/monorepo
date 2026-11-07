import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({ fetch: vi.fn(), ip: vi.fn(), header: vi.fn() }));

vi.stubGlobal("useRuntimeConfig", () => ({
    content: { vendor: { name: "wordpress", baseURL: "https://cms.test" } },
    comments: { username: "moderacion", applicationPassword: "abcd efgh" },
}));
vi.stubGlobal("$fetch", nitro.fetch);
vi.stubGlobal("getRequestIP", nitro.ip);
vi.stubGlobal("getRequestHeader", nitro.header);
vi.stubGlobal("createError", (input: Record<string, unknown>) =>
    Object.assign(new Error("http"), input),
);

const { createComment } = await import("./wordpress");

const COMMENT = {
    post: "42",
    parent: "0",
    name: "Lucía Pérez",
    email: "lucia@ejemplo.es",
    content: "Muy buen artículo.",
};

const call = () => nitro.fetch.mock.calls[0] as [string, Record<string, unknown>] | undefined;
const body = () => call()?.[1].body as Record<string, unknown>;

const refused = (code: string) =>
    Object.assign(new Error("fetch failed"), { statusCode: 400, data: { code } });

beforeEach(() => {
    vi.clearAllMocks();
    nitro.fetch.mockResolvedValue({ id: 7 });
    nitro.ip.mockReturnValue("203.0.113.9");
    nitro.header.mockReturnValue("Firefox");
});

describe("createComment", () => {
    it("posts to WordPress authenticated with the application password", async () => {
        await createComment({} as never, COMMENT);

        expect(call()?.[0]).toBe("/wp-json/wp/v2/comments");
        expect(call()?.[1]).toMatchObject({
            baseURL: "https://cms.test",
            method: "POST",
            headers: { Authorization: `Basic ${btoa("moderacion:abcd efgh")}` },
        });
    });

    it("files the comment as the reader, held for moderation, with ids as WordPress's numbers", async () => {
        await createComment({} as never, { ...COMMENT, parent: "9" });

        expect(body()).toMatchObject({
            post: 42,
            parent: 9,
            author_name: "Lucía Pérez",
            author_email: "lucia@ejemplo.es",
            status: "hold",
        });
    });

    it("passes the reader's address and browser on, so Akismet never judges this server", async () => {
        await createComment({} as never, COMMENT);

        expect(nitro.ip).toHaveBeenCalledWith({}, { xForwardedFor: true });
        expect(body()).toMatchObject({ author_ip: "203.0.113.9", author_user_agent: "Firefox" });
    });

    // An authenticated editor's comment skips kses, and wp-admin's queue would render the markup
    it("sends a reader's markup as text, never as HTML", async () => {
        await createComment({} as never, {
            ...COMMENT,
            name: "<b>Lucía</b>",
            content: "<script>alert(1)</script> & más",
        });

        expect(body()).toMatchObject({
            author_name: "bLucía/b",
            content: "&lt;script&gt;alert(1)&lt;/script&gt; &amp; más",
        });
    });

    it.each([
        ["comment_duplicate", 409],
        ["comment_flood", 429],
        ["rest_comment_closed", 410],
    ])("answers WordPress's %s with a %s the reader can act on", async (code, statusCode) => {
        nitro.fetch.mockRejectedValue(refused(code));

        await expect(createComment({} as never, COMMENT)).rejects.toMatchObject({ statusCode });
    });

    it.each([
        ["an unknown refusal", refused("rest_comment_invalid_post_id")],
        ["no answer at all", new Error("fetch failed")],
    ])("answers 502 on %s, keeping the cause", async (_, cause) => {
        nitro.fetch.mockRejectedValue(cause);

        await expect(createComment({} as never, COMMENT)).rejects.toMatchObject({
            statusCode: 502,
            cause,
        });
    });
});
