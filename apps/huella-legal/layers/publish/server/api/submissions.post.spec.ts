import * as v from "valibot";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MANUSCRIPT_MAX_BYTES } from "../../shared/schemas/submission";

const nitro = vi.hoisted(() => ({
    form: vi.fn(),
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
vi.stubGlobal("readFormData", nitro.form);
vi.stubGlobal("useRuntimeConfig", () => ({
    public: { submissionEmail: "propuestas@revista.test" },
}));
vi.stubGlobal("sendMail", nitro.sendMail);

const handler = (await import("./submissions.post")).default as unknown as (
    event: unknown,
) => Promise<void>;

const FIELDS = {
    name: "Lucía Pérez",
    email: " lucia@ejemplo.es ",
    kind: "tfg",
    title: "",
    summary: "La admisibilidad de los mensajes de WhatsApp como prueba.",
    consent: "true",
    honeypot: "",
    token: "tok",
};

const DOCX = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);

const multipart = (fields: Record<string, string>, file?: File): FormData => {
    const form = new FormData();

    for (const [name, value] of Object.entries(fields)) form.append(name, value);
    if (file) form.append("file", file);

    return form;
};

const mail = () => nitro.sendMail.mock.calls[0]?.[1] as Record<string, unknown>;

beforeEach(() => {
    vi.clearAllMocks();
    nitro.form.mockResolvedValue(multipart(FIELDS));
    nitro.assertChallenge.mockResolvedValue(undefined);
    nitro.sendMail.mockResolvedValue(undefined);
});

describe("POST /api/submissions", () => {
    it("sends a proposal with no file once to the editorial inbox, answering the trimmed author", async () => {
        await handler({});

        expect(nitro.assertChallenge).toHaveBeenCalledWith({}, "tok");
        expect(nitro.sendMail).toHaveBeenCalledOnce();
        expect(mail()).toMatchObject({
            to: "propuestas@revista.test",
            replyTo: "lucia@ejemplo.es",
            subject: "Propuesta (TFG): Lucía Pérez",
            attachments: undefined,
        });
        expect(mail().text).toContain(FIELDS.summary);
        expect(mail().text).toContain("Título provisional: -");
    });

    it("attaches the draft as base64 under its own name", async () => {
        nitro.form.mockResolvedValue(multipart(FIELDS, new File([DOCX], "borrador.docx")));

        await handler({});

        expect(mail().attachments).toEqual([
            { filename: "borrador.docx", content: DOCX.toString("base64") },
        ]);
    });

    // A bot told it failed would retry; one told it succeeded moves on
    it("answers a filled honeypot like an author, spending no verification and sending nothing", async () => {
        nitro.form.mockResolvedValue(multipart({ ...FIELDS, honeypot: "https://spam.test" }));

        await expect(handler({})).resolves.toBeUndefined();
        expect(nitro.assertChallenge).not.toHaveBeenCalled();
        expect(nitro.sendMail).not.toHaveBeenCalled();
    });

    it("answers an invalid body 422 with each field's issue code and never calls Resend", async () => {
        nitro.form.mockResolvedValue(
            multipart({ ...FIELDS, email: "autora@", summary: "  ", consent: "false" }),
        );

        await expect(handler({})).rejects.toMatchObject({
            statusCode: 422,
            data: [
                { name: "email", message: "invalid" },
                { name: "summary", message: "required" },
                { name: "consent", message: "required" },
            ],
        });
        expect(nitro.sendMail).not.toHaveBeenCalled();
    });

    it("answers a file one byte over the cap 422 on the file", async () => {
        nitro.form.mockResolvedValue(
            multipart(
                FIELDS,
                new File([new Uint8Array(MANUSCRIPT_MAX_BYTES + 1)], "borrador.docx"),
            ),
        );

        await expect(handler({})).rejects.toMatchObject({
            statusCode: 422,
            data: [{ name: "file", message: "fileSize" }],
        });
        expect(nitro.sendMail).not.toHaveBeenCalled();
    });

    it("answers a file whose bytes don't match its extension 422, so a renamed executable never reaches the inbox", async () => {
        nitro.form.mockResolvedValue(multipart(FIELDS, new File(["MZ\x90\x00"], "borrador.docx")));

        await expect(handler({})).rejects.toMatchObject({
            statusCode: 422,
            data: [{ name: "file", message: "fileType" }],
        });
        expect(nitro.sendMail).not.toHaveBeenCalled();
    });

    it("treats a body that isn't multipart as missing fields, not a crash", async () => {
        nitro.form.mockRejectedValue(new TypeError("Could not parse content as FormData."));

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
