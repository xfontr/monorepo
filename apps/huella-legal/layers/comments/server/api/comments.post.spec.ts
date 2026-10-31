import * as v from "valibot";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({
    body: vi.fn(),
    assertChallenge: vi.fn(),
    createComment: vi.fn(),
}));

const httpError = (input: Record<string, unknown>) => Object.assign(new Error("http"), input);

// The `forms` layer's `assertForm`, which reaches this layer only as a Nitro auto-import
vi.stubGlobal("assertForm", (schema: v.GenericSchema, input: unknown) => {
    const result = v.safeParse(schema, input);

    if (result.success) return result.output;

    throw httpError({
        statusCode: 422,
        data: result.issues.map((issue) => ({
            name: v.getDotPath(issue),
            message: issue.message,
        })),
    });
});
vi.stubGlobal("assertChallenge", nitro.assertChallenge);
vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("readBody", nitro.body);

vi.mock("../adapters/wordpress", () => ({ createComment: nitro.createComment }));

const handler = (await import("./comments.post")).default as unknown as (
    event: unknown,
) => Promise<void>;

const VALID = {
    post: "42",
    parent: "0",
    name: " Lucía Pérez ",
    email: "lucia@ejemplo.es",
    content: "Muy buen artículo.",
    consent: true,
    website: "",
    token: "tok",
};

beforeEach(() => {
    vi.clearAllMocks();
    nitro.body.mockResolvedValue(VALID);
    nitro.assertChallenge.mockResolvedValue(undefined);
    nitro.createComment.mockResolvedValue(undefined);
});

describe("POST /api/comments", () => {
    it("files a valid comment once, trimmed, after the challenge passes", async () => {
        await handler({});

        expect(nitro.assertChallenge).toHaveBeenCalledWith({}, "tok");
        expect(nitro.createComment).toHaveBeenCalledOnce();
        expect(nitro.createComment.mock.calls[0]?.[1]).toMatchObject({
            post: "42",
            parent: "0",
            name: "Lucía Pérez",
        });
    });

    // A bot told it failed would retry; one told it succeeded moves on
    it("answers a filled honeypot like a reader, spending no verification and filing nothing", async () => {
        nitro.body.mockResolvedValue({ ...VALID, website: "https://spam.test" });

        await expect(handler({})).resolves.toBeUndefined();
        expect(nitro.assertChallenge).not.toHaveBeenCalled();
        expect(nitro.createComment).not.toHaveBeenCalled();
    });

    it("answers an invalid body 422 with each field's issue code and files nothing", async () => {
        nitro.body.mockResolvedValue({
            ...VALID,
            email: "lucia@",
            content: "x".repeat(5001),
            consent: false,
        });

        await expect(handler({})).rejects.toMatchObject({
            statusCode: 422,
            data: [
                { name: "email", message: "invalid" },
                { name: "content", message: "long" },
                { name: "consent", message: "required" },
            ],
        });
        expect(nitro.createComment).not.toHaveBeenCalled();
    });

    it.each([
        ["an article id that isn't a number", { post: "../users" }],
        ["no comment to reply to", { parent: undefined }],
    ])("refuses %s rather than letting WordPress guess", async (_, change) => {
        nitro.body.mockResolvedValue({ ...VALID, ...change });

        await expect(handler({})).rejects.toMatchObject({ statusCode: 422 });
        expect(nitro.createComment).not.toHaveBeenCalled();
    });

    it("treats an empty body as missing fields, not a crash", async () => {
        nitro.body.mockResolvedValue(undefined);

        await expect(handler({})).rejects.toMatchObject({ statusCode: 422 });
    });

    it("keeps the challenge's status, so a failed token is a 403 and nothing is filed", async () => {
        nitro.assertChallenge.mockRejectedValue(httpError({ statusCode: 403 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 403 });
        expect(nitro.createComment).not.toHaveBeenCalled();
    });
});
