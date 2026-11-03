import * as v from "valibot";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nitro = vi.hoisted(() => ({
    body: vi.fn(),
    assertChallenge: vi.fn(),
    sendMail: vi.fn(),
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
vi.stubGlobal("useRuntimeConfig", () => ({ mail: { to: "redaccion@revista.test" } }));
vi.stubGlobal("sendMail", nitro.sendMail);

const handler = (await import("./contact.post")).default as unknown as (
    event: unknown,
) => Promise<void>;

const VALID = {
    name: "Lucía Pérez",
    email: " lucia@ejemplo.es ",
    message: "Una pregunta sobre el último número.",
    consent: true,
    honeypot: "",
    token: "tok",
};

beforeEach(() => {
    vi.clearAllMocks();
    nitro.body.mockResolvedValue(VALID);
    nitro.assertChallenge.mockResolvedValue(undefined);
    nitro.sendMail.mockResolvedValue(undefined);
});

describe("POST /api/contact", () => {
    it("sends a valid message once to Contacto's inbox, answering the trimmed sender, with no attachment", async () => {
        await handler({});

        expect(nitro.assertChallenge).toHaveBeenCalledWith({}, "tok");
        expect(nitro.sendMail).toHaveBeenCalledExactlyOnceWith(
            {},
            {
                to: "redaccion@revista.test",
                replyTo: "lucia@ejemplo.es",
                subject: "Contacto: Lucía Pérez",
                text: "Una pregunta sobre el último número.\n\n— Lucía Pérez <lucia@ejemplo.es>",
            },
        );
    });

    // A bot told it failed would retry; one told it succeeded moves on
    it("answers a filled honeypot like a reader, spending no verification and sending nothing", async () => {
        nitro.body.mockResolvedValue({ ...VALID, honeypot: "https://spam.test" });

        await expect(handler({})).resolves.toBeUndefined();
        expect(nitro.assertChallenge).not.toHaveBeenCalled();
        expect(nitro.sendMail).not.toHaveBeenCalled();
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
        expect(nitro.sendMail).not.toHaveBeenCalled();
    });

    it("treats an empty body as missing fields, not a crash", async () => {
        nitro.body.mockResolvedValue(undefined);

        await expect(handler({})).rejects.toMatchObject({ statusCode: 422 });
        expect(nitro.sendMail).not.toHaveBeenCalled();
    });

    it("keeps the challenge's status, so a failed token is a 403 and nothing is sent", async () => {
        nitro.assertChallenge.mockRejectedValue(httpError({ statusCode: 403 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 403 });
        expect(nitro.sendMail).not.toHaveBeenCalled();
    });

    it("keeps the mail's status, so a failed send is a 502", async () => {
        nitro.sendMail.mockRejectedValue(httpError({ statusCode: 502 }));

        await expect(handler({})).rejects.toMatchObject({ statusCode: 502 });
    });
});
