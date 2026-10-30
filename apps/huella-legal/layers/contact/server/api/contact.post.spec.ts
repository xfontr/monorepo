import * as v from "valibot";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({
    body: vi.fn(),
    assertChallenge: vi.fn(),
    fetch: vi.fn(),
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
vi.stubGlobal("createError", httpError);
vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("readBody", nitro.body);
vi.stubGlobal("useRuntimeConfig", () => ({
    mail: {
        baseURL: "https://mail.test",
        apiKey: "resend-key",
        from: "web@revista.test",
        to: "redaccion@revista.test",
    },
}));
vi.stubGlobal("$fetch", nitro.fetch);

const handler = (await import("./contact.post")).default as unknown as (
    event: unknown,
) => Promise<void>;

const VALID = {
    name: "Lucía Pérez",
    email: " lucia@ejemplo.es ",
    message: "Una pregunta sobre el último número.",
    consent: true,
    website: "",
    token: "tok",
};

beforeEach(() => {
    vi.clearAllMocks();
    nitro.body.mockResolvedValue(VALID);
    nitro.assertChallenge.mockResolvedValue(undefined);
    nitro.fetch.mockResolvedValue({ id: "email1" });
});

describe("POST /api/contact", () => {
    it("sends a valid message to Resend once, with Reply-To set to the trimmed sender and no attachment", async () => {
        await handler({});

        expect(nitro.assertChallenge).toHaveBeenCalledWith({}, "tok");
        expect(nitro.fetch).toHaveBeenCalledOnce();

        const { body } = nitro.fetch.mock.calls[0]?.[1] as { body: Record<string, unknown> };

        expect(body).toMatchObject({ to: "redaccion@revista.test", reply_to: "lucia@ejemplo.es" });
        expect(body).not.toHaveProperty("attachments");
    });

    // A bot told it failed would retry; one told it succeeded moves on
    it("answers a filled honeypot like a reader, spending no verification and sending nothing", async () => {
        nitro.body.mockResolvedValue({ ...VALID, website: "https://spam.test" });

        await expect(handler({})).resolves.toBeUndefined();
        expect(nitro.assertChallenge).not.toHaveBeenCalled();
        expect(nitro.fetch).not.toHaveBeenCalled();
    });

    it("answers an invalid body 422 with each field's issue code and never calls Resend", async () => {
        nitro.body.mockResolvedValue({ ...VALID, email: "lucia@", message: "  ", consent: false });

        await expect(handler({})).rejects.toMatchObject({
            statusCode: 422,
            data: [
                { name: "email", message: "invalid" },
                { name: "message", message: "required" },
                { name: "consent", message: "required" },
            ],
        });
        expect(nitro.fetch).not.toHaveBeenCalled();
    });

    it("treats an empty body as missing fields, not a crash", async () => {
        nitro.body.mockResolvedValue(undefined);

        await expect(handler({})).rejects.toMatchObject({ statusCode: 422 });
        expect(nitro.fetch).not.toHaveBeenCalled();
    });

    it("keeps the challenge's status, so a failed token is a 403 and nothing is sent", async () => {
        nitro.assertChallenge.mockRejectedValue(httpError({ statusCode: 403 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 403 });
        expect(nitro.fetch).not.toHaveBeenCalled();
    });

    it("answers 502 when Resend refuses the send", async () => {
        nitro.fetch.mockRejectedValue(httpError({ statusCode: 403 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 502 });
    });
});
